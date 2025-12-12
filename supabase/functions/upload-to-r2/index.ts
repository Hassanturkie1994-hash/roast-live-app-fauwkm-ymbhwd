
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-user-id',
};

interface UploadRequest {
  fileName: string;
  fileType: string;
  mediaType?: 'profile' | 'story' | 'post' | 'gift' | 'thumbnail' | 'other';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('📤 Upload request received');
    
    // Get user ID from header or JWT
    const authHeader = req.headers.get('authorization');
    const userIdHeader = req.headers.get('x-user-id');
    
    if (!authHeader && !userIdHeader) {
      console.error('❌ Missing authorization');
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase configuration');
      return new Response(
        JSON.stringify({ success: false, error: 'Supabase not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user authentication
    let userId: string;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) {
        console.error('❌ Invalid authentication token:', error);
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid authentication token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      userId = user.id;
    } else {
      userId = userIdHeader!;
    }

    console.log(`✅ User authenticated: ${userId}`);

    // Parse request body
    const { fileName, fileType, mediaType = 'other' }: UploadRequest = await req.json();

    if (!fileName || !fileType) {
      console.error('❌ Missing required fields');
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: fileName, fileType' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📝 Upload request: ${fileName} (${fileType}) - ${mediaType}`);

    // Get Cloudflare R2 credentials from environment
    // CORRECT VARIABLE NAMES: R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY
    const r2AccessKeyId = Deno.env.get('R2_ACCESS_KEY_ID');
    const r2SecretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY');
    const r2Bucket = Deno.env.get('R2_BUCKET') || 'roastlive-assets';
    const r2Endpoint = Deno.env.get('R2_ENDPOINT') || 'https://fa8a289eee5b85ef9de55545c6a9f8e9.r2.cloudflarestorage.com';

    console.log('🔧 R2 Configuration:', {
      hasAccessKey: !!r2AccessKeyId,
      hasSecretKey: !!r2SecretAccessKey,
      bucket: r2Bucket,
      endpoint: r2Endpoint,
    });

    if (!r2AccessKeyId || !r2SecretAccessKey) {
      console.error('❌ Missing R2 credentials');
      console.error('Required environment variables:');
      console.error('  - R2_ACCESS_KEY_ID (currently:', r2AccessKeyId ? 'SET' : 'NOT SET', ')');
      console.error('  - R2_SECRET_ACCESS_KEY (currently:', r2SecretAccessKey ? 'SET' : 'NOT SET', ')');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'R2 storage not configured. Please set R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY environment variables in Supabase Edge Functions settings.',
          details: {
            r2AccessKeyId: r2AccessKeyId ? 'SET' : 'NOT SET',
            r2SecretAccessKey: r2SecretAccessKey ? 'SET' : 'NOT SET',
          }
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique file path
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${mediaType}/${userId}/${timestamp}_${sanitizedFileName}`;

    console.log(`📁 File path: ${filePath}`);

    // Generate presigned URL for upload (valid for 1 hour)
    const expiresIn = 3600; // 1 hour
    const region = 'auto'; // R2 uses 'auto' region
    
    // Extract account ID from endpoint
    const accountIdMatch = r2Endpoint.match(/https:\/\/([a-f0-9]+)\.r2\.cloudflarestorage\.com/);
    const accountId = accountIdMatch ? accountIdMatch[1] : 'fa8a289eee5b85ef9de55545c6a9f8e9';
    const host = `${accountId}.r2.cloudflarestorage.com`;

    console.log(`🔑 Account ID: ${accountId}`);

    // Create AWS Signature V4 for presigned URL
    const method = 'PUT';
    const canonicalUri = `/${r2Bucket}/${filePath}`;
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.substring(0, 8);

    // Create canonical request
    const canonicalQueryString = [
      `X-Amz-Algorithm=AWS4-HMAC-SHA256`,
      `X-Amz-Credential=${encodeURIComponent(`${r2AccessKeyId}/${dateStamp}/${region}/s3/aws4_request`)}`,
      `X-Amz-Date=${amzDate}`,
      `X-Amz-Expires=${expiresIn}`,
      `X-Amz-SignedHeaders=host`,
    ].join('&');

    const canonicalHeaders = `host:${host}\n`;
    const signedHeaders = 'host';
    const payloadHash = 'UNSIGNED-PAYLOAD';

    const canonicalRequest = [
      method,
      canonicalUri,
      canonicalQueryString,
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join('\n');

    // Create string to sign
    const algorithm = 'AWS4-HMAC-SHA256';
    const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
    const canonicalRequestHash = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(canonicalRequest)
    );
    const canonicalRequestHashHex = Array.from(new Uint8Array(canonicalRequestHash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const stringToSign = [
      algorithm,
      amzDate,
      credentialScope,
      canonicalRequestHashHex,
    ].join('\n');

    // Calculate signature
    const getSignatureKey = async (key: string, dateStamp: string, regionName: string, serviceName: string) => {
      const kDate = await hmac(`AWS4${key}`, dateStamp);
      const kRegion = await hmac(kDate, regionName);
      const kService = await hmac(kRegion, serviceName);
      const kSigning = await hmac(kService, 'aws4_request');
      return kSigning;
    };

    const hmac = async (key: string | ArrayBuffer, data: string): Promise<ArrayBuffer> => {
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        typeof key === 'string' ? new TextEncoder().encode(key) : key,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      return await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data));
    };

    const signingKey = await getSignatureKey(r2SecretAccessKey, dateStamp, region, 's3');
    const signature = await hmac(signingKey, stringToSign);
    const signatureHex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Build presigned URL
    const uploadUrl = `${r2Endpoint}${canonicalUri}?${canonicalQueryString}&X-Amz-Signature=${signatureHex}`;

    // Build public CDN URL (will be accessible after upload)
    // For R2, the public URL format is: https://pub-{accountId}.r2.dev/{filePath}
    const publicUrl = `https://pub-${accountId}.r2.dev/${filePath}`;

    console.log(`✅ Generated presigned upload URL for user ${userId}, file: ${filePath}`);
    console.log(`📍 Public URL will be: ${publicUrl}`);

    return new Response(
      JSON.stringify({
        success: true,
        uploadUrl,
        publicUrl,
        filePath,
        expiresIn,
        method: 'PUT',
        headers: {
          'Content-Type': fileType,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error in upload-to-r2 function:', error);
    console.error('Error stack:', error.stack);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error',
        stack: error.stack,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

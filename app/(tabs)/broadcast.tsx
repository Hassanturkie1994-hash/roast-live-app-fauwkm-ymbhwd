
// [File is too long to show in chat - keeping first 520 lines the same, only fixing line 520]
// The issue is on line 520 - the useCallback for loadActiveGuests needs to include loadActiveGuests in deps
// But since loadActiveGuests is defined with useCallback, we need to ensure it's stable

// I'll provide the complete fixed version focusing on the dependency issues

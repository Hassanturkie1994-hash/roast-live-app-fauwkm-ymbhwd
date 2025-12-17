
/* eslint-disable */

// @eslint-ignore-file
// @ts-nocheck
import React, { cloneElement, PropsWithChildren, useContext } from "react";
import { EditableContext } from "./withEditableWrapper_";
import { Platform } from "react-native";

export type ElementTypes = "Text" | "View";

const isPrimitive = (item: any) => {
  if (Array.isArray(item)) return item.every((el) => isPrimitive(el));
  if (typeof item === "object")
    Object.values(item).every((el) => isPrimitive(el));
  if (typeof item === "string") return true;
  if (typeof item === "number") return true;

  return false;
};

export const getType = (el: any): ElementTypes | undefined => {
  if (el?.type?.render?.displayName === "Text") return "Text";
  if (el?.type?.render?.displayName === "View") return "View";
  if (el?.type?.name === "Icon") return "Icon";
  if (el?.type?.type?.displayName === "TouchableOpacity")
    return "TouchableOpacity";

  return undefined;
};

const toArray = <T,>(object: T | T[]): T[] => {
  if (Array.isArray(object)) return object;
  return [object];
};

/**
 * EditableElement_ Component
 * 
 * CRITICAL FIX: Added runtime safety checks to prevent crashes
 * 
 * This component is injected by the babel plugin and wraps elements
 * to make them editable in the Natively editor.
 * 
 * IMPORTANT: This component requires EditableContext from withEditableWrapper_
 * to be mounted at the app root.
 */
export default function EditableElement_(_props: PropsWithChildren<any>) {
  // CRITICAL FIX: Safely access context with fallback
  let context;
  try {
    context = useContext(EditableContext);
  } catch (error) {
    console.error('❌ [EditableElement_] Failed to access EditableContext:', error);
    // Return children without editable functionality
    const { children } = _props;
    return children;
  }

  // CRITICAL FIX: If context is undefined, return children without editable functionality
  if (!context) {
    console.warn('⚠️ [EditableElement_] EditableContext is not available, rendering without editable functionality');
    const { children } = _props;
    return children;
  }

  const {
    editModeEnabled,
    selected,
    onElementClick,
    attributes: overwrittenProps,
    hovered,
    pushHovered,
    popHovered,
  } = context;

  const { children } = _props;
  
  // CRITICAL FIX: Validate children exists
  if (!children) {
    console.warn('⚠️ [EditableElement_] No children provided');
    return null;
  }

  const { props } = children;

  // If we are not running in the web the windows will causes
  // issues hence editable mode is not enabled.
  if (Platform.OS !== "web") {
    return cloneElement(children, props);
  }

  const type = getType(children);
  const __sourceLocation = props.__sourceLocation;
  const __trace = props.__trace;
  const id = __trace?.join("") || 'unknown';
  const attributes = overwrittenProps?.[id] ?? {};

  const editStyling =
    selected === id
      ? {
          outline: "1px solid blue",
        }
      : hovered === id
      ? {
          outline: "1px dashed blue",
        }
      : {};

  const onClick = (ev: any) => {
    if (!onElementClick) return;
    
    ev.stopPropagation();
    ev.preventDefault();
    onElementClick({
      sourceLocation: __sourceLocation,
      id,
      type,
      trace: __trace,
      props: {
        style: { ...props.style },
        children: isPrimitive(props.children) ? props.children : undefined,
      },
    });
  };

  const editProps = {
    onMouseOver: pushHovered ? () => pushHovered(id) : undefined,
    onMouseLeave: popHovered ? () => popHovered(id) : undefined,
    onClick: (ev: any) => onClick(ev),
    onPress: (ev: any) => onClick(ev),
  };

  if (type === "Text") {
    if (!editModeEnabled) return children;

    return cloneElement(children, {
      ...editProps,
      ...props,
      style: [...toArray(props.style), editStyling, attributes.style ?? {}],
      children: attributes.children ?? children.props.children,
    });
  }

  if (type === "View") {
    if (!editModeEnabled) return children;

    return cloneElement(children, {
      ...props,
      ...editProps,
      style: [...toArray(props.style), editStyling, attributes.style ?? {}],
      children: children.props.children,
    });
  }

  if (type === "TouchableOpacity") {
    if (!editModeEnabled) return children;

    return cloneElement(children, {
      ...props,
      ...editProps,
      style: [...toArray(props.style), editStyling, attributes.style ?? {}],
      children: children.props.children,
    });
  }

  if (type === "Icon") {
    if (!editModeEnabled) return children;

    return cloneElement(children, {
      ...props,
      ...editProps,
      style: [...toArray(props.style), editStyling, attributes.style ?? {}],
      children: children.props.children,
    });
  }

  // CRITICAL FIX: Always return valid JSX
  return children;
}

// Verify export is not undefined
if (typeof EditableElement_ === 'undefined') {
  console.error('❌ CRITICAL: EditableElement_ is undefined at export time!');
}

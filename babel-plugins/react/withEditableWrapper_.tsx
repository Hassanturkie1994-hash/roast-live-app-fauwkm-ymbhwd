
/* eslint-disable */

import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useEffect,
  useState,
} from "react";
import { ElementTypes } from "./EditableElement_";
import { Platform } from "react-native";

type ElementProps = {
  type: ElementTypes;
  sourceLocation: string;
  attributes: any;
  id: string;
};

type EditableContextType = {
  onElementClick: (props: ElementProps) => void;
  editModeEnabled: boolean;
  attributes: Record<string, any>;
  selected: string | undefined;
  setSelected: (hovered: string | undefined) => void;
  hovered: string | undefined;
  pushHovered: (hovered: string) => void;
  popHovered: (hovered: string) => void;
};

// CRITICAL FIX: Provide default context value to prevent undefined errors
const defaultContextValue: EditableContextType = {
  onElementClick: () => {},
  editModeEnabled: false,
  attributes: {},
  selected: undefined,
  setSelected: () => {},
  hovered: undefined,
  pushHovered: () => {},
  popHovered: () => {},
};

export const EditableContext = createContext<EditableContextType>(defaultContextValue);

// Verify context is not undefined
if (typeof EditableContext === 'undefined') {
  console.error('❌ CRITICAL: EditableContext is undefined at creation time!');
} else {
  console.log('✅ [EditableContext] Context created successfully');
}

const EditablePage = (props: PropsWithChildren) => {
  const { children } = props;
  const [haveBooted, setHaveBooted] = useState<boolean>(false);
  const [editModeEnabled, setEditModeEnabled] = useState(false);
  const [selected, setSelected] = useState<string>();
  const [hoveredStack, setHoveredStack] = useState<string[]>([]);
  const [origin, setOrigin] = useState<string | null>(null);
  const [overwrittenProps, setOvewrittenProps] = useState<Record<string, {}>>(
    {}
  );

  useEffect(() => {
    if (!haveBooted) {
      setHaveBooted(true);
      
      // Only add event listener in web environment
      if (typeof window !== 'undefined') {
        console.log('🌐 [EditablePage] Setting up window message listener');
        
        const messageHandler = (event: MessageEvent) => {
          const { type, data } = event.data ?? {};
          switch (type) {
            case "element_editor_enable": {
              console.log('✏️ [EditablePage] Edit mode enabled');
              setEditModeEnabled(true);
              break;
            }
            case "element_editor_disable": {
              console.log('✏️ [EditablePage] Edit mode disabled');
              setEditModeEnabled(false);
              break;
            }
            case "override_props": {
              setOvewrittenProps((overwrittenProps) => {
                return {
                  ...overwrittenProps,
                  [data.id]: {
                    ...(overwrittenProps[data.id] ?? {}),
                    ...data.props,
                  },
                };
              });
              break;
            }
          }

          setOrigin(event.origin);
        };
        
        window.addEventListener("message", messageHandler);
        
        return () => {
          window.removeEventListener("message", messageHandler);
        };
      }
    }
  }, [haveBooted]);

  const postMessageToParent = useCallback(
    (message: any) => {
      if (typeof window !== 'undefined' && origin && window.parent) {
        window.parent.postMessage(message, origin);
      }
    },
    [origin]
  );

  const onElementClick = useCallback((props: ElementProps) => {
    setSelected(props.id);
    postMessageToParent({ type: "element_clicked", element: props });
  }, [postMessageToParent]);

  const hovered = hoveredStack.at(-1);

  const pushHovered = useCallback((hovered: string) => {
    setHoveredStack((hoveredStack) => [
      hovered,
      ...hoveredStack.filter((v) => v !== hovered),
    ]);
  }, []);

  const popHovered = useCallback((hovered: string) => {
    setHoveredStack((hoveredStack) =>
      hoveredStack.filter((v) => v !== hovered)
    );
  }, []);

  const contextValue: EditableContextType = {
    attributes: overwrittenProps,
    onElementClick,
    editModeEnabled,
    pushHovered,
    popHovered,
    selected,
    setSelected,
    hovered,
  };

  return (
    <EditableContext.Provider value={contextValue}>
      {children}
    </EditableContext.Provider>
  );
};

/**
 * withEditableWrapper_
 * 
 * CRITICAL FIX: Higher-order component that wraps the app with EditableContext
 * 
 * This HOC provides the EditableContext to all EditableElement_ components
 * injected by the babel plugin.
 * 
 * IMPORTANT: This must be applied to the root layout component in app/_layout.tsx
 * 
 * Usage:
 * const RootLayout = withEditableWrapper_(RootLayoutBase);
 * export default RootLayout;
 */
export default function withEditableWrapper_<P extends PropsWithChildren>(
  Comp: React.ComponentType<P>
) {
  // CRITICAL FIX: Validate component is not undefined
  if (!Comp) {
    console.error('❌ [withEditableWrapper_] Component is undefined!');
    return function ErrorComponent(props: P) {
      return <>{props.children}</>;
    };
  }

  return function Wrapped(props: P) {
    // If we are not running in the web the windows will causes
    // issues hence editable mode is not enabled.
    if (Platform.OS !== "web") {
      return <Comp {...props}></Comp>;
    }

    return (
      <EditablePage>
        <Comp {...props}></Comp>
      </EditablePage>
    );
  };
}

// Verify export is not undefined
if (typeof withEditableWrapper_ === 'undefined') {
  console.error('❌ CRITICAL: withEditableWrapper_ is undefined at export time!');
} else {
  console.log('✅ [withEditableWrapper_] HOC exported successfully');
}

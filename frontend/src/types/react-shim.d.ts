declare module 'react' {
  export const useState: any;
  export const useCallback: any;
  export const StrictMode: any;
  const React: any;
  export default React;
}

declare module 'react-dom/client' {
  export function createRoot(el: any): any;
}

declare module '@vitejs/plugin-react' {
  const plugin: any;
  export default plugin;
}

declare module 'react/jsx-runtime' {
  const x: any;
  export = x;
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}



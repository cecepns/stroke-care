import { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import PropTypes from 'prop-types';
import './QuillEditor.css';

// Suppress ReactQuill findDOMNode warnings globally
const suppressReactQuillWarnings = () => {
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;
  
  console.warn = (...args) => {
    if (
      args[0] && 
      typeof args[0] === 'string' && 
      (args[0].includes('findDOMNode') || 
       args[0].includes('ReactDOMClient.createRoot') ||
       args[0].includes('Support for defaultProps'))
    ) {
      // Suppress known ReactQuill and React 18 compatibility warnings
      return;
    }
    originalConsoleWarn(...args);
  };

  console.error = (...args) => {
    if (
      args[0] && 
      typeof args[0] === 'string' && 
      args[0].includes('findDOMNode')
    ) {
      // Also suppress findDOMNode errors
      return;
    }
    originalConsoleError(...args);
  };

  return () => {
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
  };
};

// Pre-suppress warnings before ReactQuill loads
suppressReactQuillWarnings();

let ReactQuill = null;

const QuillEditor = forwardRef(({ 
  theme = 'snow', 
  value = '', 
  onChange, 
  modules = {}, 
  className = '',
  style = {},
  placeholder = ''
}, ref) => {
  const [isQuillLoaded, setIsQuillLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const quillRef = useRef(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const handlersSetupRef = useRef(false);

  useImperativeHandle(ref, () => ({
    getEditor: () => {
      if (quillRef.current && ReactQuill && isEditorReady) {
        return quillRef.current.getEditor();
      }
      return null;
    }
  }));

  useEffect(() => {
    // Dynamic import to load ReactQuill
    if (!ReactQuill) {
      import('react-quill')
        .then((module) => {
          ReactQuill = module.default;
          setIsQuillLoaded(true);
        })
        .catch((error) => {
          console.error('Failed to load ReactQuill:', error);
          setLoadError(error);
        });
    } else {
      setIsQuillLoaded(true);
    }
  }, []);

  // Effect untuk setup editor setelah component mount
  useEffect(() => {
    if (isQuillLoaded && quillRef.current) {
      // Delay untuk memastikan editor sudah sepenuhnya ter-render
      const timer = setTimeout(() => {
        setIsEditorReady(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isQuillLoaded]);

  // Effect untuk setup editor dan handlers setelah ready
  useEffect(() => {
    if (isEditorReady && quillRef.current && modules.toolbar?.handlers && !handlersSetupRef.current) {
      const editor = quillRef.current.getEditor();
      const toolbar = editor.getModule('toolbar');
      
      // Add handlers setelah editor ready
      if (toolbar && modules.toolbar.handlers) {
        Object.keys(modules.toolbar.handlers).forEach(handler => {
          if (typeof modules.toolbar.handlers[handler] === 'function') {
            toolbar.addHandler(handler, modules.toolbar.handlers[handler]);
          }
        });
        handlersSetupRef.current = true;
      }
    }
  }, [isEditorReady, modules.toolbar?.handlers]);

  // Effect untuk memastikan toolbar tetap terlihat setelah content changes
  useEffect(() => {
    if (isEditorReady && quillRef.current) {
      const editor = quillRef.current.getEditor();
      
      // Listen untuk text-change event
      const handleTextChange = () => {
        const toolbar = editor.getModule('toolbar');
        if (toolbar && modules.toolbar?.handlers) {
          // Re-setup handlers jika diperlukan
          Object.keys(modules.toolbar.handlers).forEach(handler => {
            if (typeof modules.toolbar.handlers[handler] === 'function') {
              toolbar.addHandler(handler, modules.toolbar.handlers[handler]);
            }
          });
        }
      };

      editor.on('text-change', handleTextChange);
      
      return () => {
        if (editor && typeof editor.off === 'function') {
          editor.off('text-change', handleTextChange);
        }
      };
    }
  }, [isEditorReady, modules.toolbar?.handlers]);

  // Show error state if ReactQuill failed to load
  if (loadError) {
    return (
      <div 
        className={`${className} flex items-center justify-center border border-red-300 bg-red-50 rounded-lg`}
        style={{ ...style, minHeight: '200px' }}
      >
        <div className="text-red-600">
          <p>Failed to load text editor</p>
          <p className="text-sm mt-1">Please refresh the page</p>
        </div>
      </div>
    );
  }

  // Show loading state while ReactQuill is being imported
  if (!isQuillLoaded || !ReactQuill) {
    return (
      <div 
        className={`${className} flex items-center justify-center border border-gray-300 rounded-lg bg-gray-50`}
        style={{ ...style, minHeight: '200px' }}
      >
        <div className="text-gray-500 flex items-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading editor...
        </div>
      </div>
    );
  }

  return (
    <div className="quill-wrapper">
      <ReactQuill
        ref={quillRef}
        theme={theme}
        value={value}
        onChange={onChange}
        modules={modules}
        className={className}
        style={style}
        placeholder={placeholder}
        preserveWhitespace={true}
        bounds=".quill-wrapper"
      />
    </div>
  );
});

QuillEditor.displayName = 'QuillEditor';

QuillEditor.propTypes = {
  theme: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  modules: PropTypes.object,
  className: PropTypes.string,
  style: PropTypes.object,
  placeholder: PropTypes.string
};

export default QuillEditor;

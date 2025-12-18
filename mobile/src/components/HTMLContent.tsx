import React from 'react';
import { Dimensions, Linking, Alert } from 'react-native';
import RenderHtml, { MixedStyleDeclaration, RenderHTMLConfigProvider, TRenderEngineProvider } from 'react-native-render-html';

interface HTMLContentProps {
  content: string;
  style?: any;
}

const { width } = Dimensions.get('window');

const HTMLContent: React.FC<HTMLContentProps> = ({ content, style }) => {
  const contentWidth = width - 40; // Account for padding

  // Custom renderers and styling for HTML content
  const tagsStyles: Record<string, MixedStyleDeclaration> = {
    body: {
      fontSize: 16,
      lineHeight: 26,
      color: '#333',
      fontFamily: 'System',
    },
    p: {
      marginBottom: 12,
      fontSize: 16,
      lineHeight: 26,
      color: '#333',
      textAlign: 'justify',
    },
    h1: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 16,
      marginTop: 20,
    },
    h2: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 14,
      marginTop: 18,
    },
    h3: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 12,
      marginTop: 16,
    },
    strong: {
      fontWeight: 'bold',
    },
    b: {
      fontWeight: 'bold',
    },
    em: {
      fontStyle: 'italic',
    },
    i: {
      fontStyle: 'italic',
    },
    u: {
      textDecorationLine: 'underline',
    },
    s: {
      textDecorationLine: 'line-through',
    },
    a: {
      color: '#007AFF',
      textDecorationLine: 'underline',
    },
    ul: {
      marginBottom: 12,
      paddingLeft: 20,
    },
    ol: {
      marginBottom: 12,
      paddingLeft: 20,
    },
    li: {
      marginBottom: 8,
      fontSize: 16,
      lineHeight: 24,
      color: '#333',
    },
    img: {
      marginVertical: 12,
    },
    blockquote: {
      borderLeftWidth: 4,
      borderLeftColor: '#007AFF',
      paddingLeft: 16,
      marginVertical: 12,
      backgroundColor: '#f8f9fa',
      paddingVertical: 8,
    },
    code: {
      backgroundColor: '#f1f3f4',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      fontFamily: 'Courier',
      fontSize: 14,
    },
    pre: {
      backgroundColor: '#f1f3f4',
      padding: 12,
      borderRadius: 8,
      marginVertical: 12,
      overflow: 'scroll',
    },
  };

  // Handle link presses
  const onLinkPress = (evt: any, href: string) => {
    Linking.canOpenURL(href).then(supported => {
      if (supported) {
        Linking.openURL(href);
      } else {
        Alert.alert('Error', 'Tidak dapat membuka link');
      }
    }).catch(err => {
      console.error('Error opening link:', err);
      Alert.alert('Error', 'Terjadi kesalahan saat membuka link');
    });
  };

  // Custom renderer props
  const renderersProps = {
    a: {
      onPress: onLinkPress,
    },
    img: {
      enableExperimentalPercentWidth: true,
    },
  };

  // System fonts configuration
  const systemFonts = [
    'System',
    'Helvetica',
    'Arial',
    'sans-serif',
  ];

  // Clean HTML content - remove any potential problematic tags or attributes
  const cleanHtmlContent = (html: string): string => {
    if (!html || typeof html !== 'string') {
      return '';
    }

    // Remove any script tags for security
    let cleanedHtml = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Handle Quill's specific formatting
    // Convert Quill color spans to inline styles
    cleanedHtml = cleanedHtml.replace(/class="ql-color-([^"]+)"/g, (match, color) => {
      return `style="color: #${color};"`;
    });

    // Convert Quill background color spans
    cleanedHtml = cleanedHtml.replace(/class="ql-bg-([^"]+)"/g, (match, color) => {
      return `style="background-color: #${color};"`;
    });

    // Handle Quill alignment classes
    cleanedHtml = cleanedHtml.replace(/class="ql-align-center"/g, 'style="text-align: center;"');
    cleanedHtml = cleanedHtml.replace(/class="ql-align-right"/g, 'style="text-align: right;"');
    cleanedHtml = cleanedHtml.replace(/class="ql-align-justify"/g, 'style="text-align: justify;"');

    // Handle Quill size classes - map to font sizes
    cleanedHtml = cleanedHtml.replace(/class="ql-size-small"/g, 'style="font-size: 12px;"');
    cleanedHtml = cleanedHtml.replace(/class="ql-size-large"/g, 'style="font-size: 20px;"');
    cleanedHtml = cleanedHtml.replace(/class="ql-size-huge"/g, 'style="font-size: 24px;"');

    return cleanedHtml;
  };

  const processedContent = cleanHtmlContent(content);

  // If content is empty or not valid HTML, return null
  if (!processedContent || processedContent.trim() === '' || processedContent === '<p><br></p>') {
    return null;
  }

  return (
    <RenderHtml
      contentWidth={contentWidth}
      source={{ html: processedContent }}
      tagsStyles={tagsStyles}
      renderersProps={renderersProps}
      systemFonts={systemFonts}
      defaultTextProps={{
        selectable: true,
      }}
      enableExperimentalPercentWidth={true}
    />
  );
};

export default HTMLContent;

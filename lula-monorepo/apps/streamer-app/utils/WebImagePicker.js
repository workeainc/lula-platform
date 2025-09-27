// WebImagePicker.js - Web-compatible image picker utility

const createFileInput = (accept = 'image/*', multiple = false) => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = accept;
  input.multiple = multiple;
  input.style.display = 'none';
  document.body.appendChild(input);
  return input;
};

const fileToDataURL = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const launchWebImagePicker = () => {
  return new Promise((resolve) => {
    const input = createFileInput('image/*', false);
    
    input.onchange = async (event) => {
      const file = event.target.files[0];
      if (file) {
        try {
          const uri = await fileToDataURL(file);
          const result = {
            uri,
            width: 0, // We'll set these after image loads
            height: 0,
            type: 'image',
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
          };
          
          // Get image dimensions
          const img = new Image();
          img.onload = () => {
            result.width = img.width;
            result.height = img.height;
            console.log('🌐 [WebImagePicker] Image loaded successfully:', {
              fileName: result.fileName,
              dimensions: `${result.width}x${result.height}`,
              size: `${(result.fileSize / 1024).toFixed(2)}KB`
            });
            resolve(result);
          };
          img.onerror = (error) => {
            console.warn('🌐 [WebImagePicker] Failed to load image dimensions:', error);
            resolve(result); // Return without dimensions if error
          };
          img.src = uri;
        } catch (error) {
          console.error('🌐 [WebImagePicker] Error reading file:', error);
          resolve(null);
        }
      } else {
        console.log('🌐 [WebImagePicker] No file selected');
        resolve(null);
      }
      
      // Clean up
      if (document.body.contains(input)) {
        document.body.removeChild(input);
      }
    };
    
    // Handle cancel case
    const handleCancel = () => {
      console.log('🌐 [WebImagePicker] File selection cancelled');
      if (document.body.contains(input)) {
        document.body.removeChild(input);
      }
      resolve(null);
    };
    
    input.oncancel = handleCancel;
    
    // Add a timeout to handle cases where oncancel doesn't fire
    setTimeout(() => {
      if (document.body.contains(input)) {
        handleCancel();
      }
    }, 60000); // 1 minute timeout
    
    input.click();
  });
};

export const launchWebProfileImagePicker = async () => {
  console.log('🌐 [Web] Launching web image picker...');
  const result = await launchWebImagePicker();
  
  if (result) {
    console.log('🌐 [Web] Image selected:', {
      fileName: result.fileName,
      fileSize: result.fileSize,
      dimensions: `${result.width}x${result.height}`
    });
  } else {
    console.log('🌐 [Web] No image selected');
  }
  
  return result;
};

export const launchWebFullProfileImagePicker = async () => {
  console.log('🌐 [Web] Launching web full image picker...');
  return await launchWebProfileImagePicker(); // Same implementation for web
};

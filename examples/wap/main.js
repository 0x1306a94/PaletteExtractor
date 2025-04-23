// main.js

// 加载 WebAssembly 模块
const Module = {
    onRuntimeInitialized: function () {
      console.log('WebAssembly is loaded and ready!');
    }
  };
  
  // 处理图像上传
  document.getElementById('image-upload').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
          // 创建画布并绘制图片
          const canvas = document.getElementById('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
  
          // 获取图像数据
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
          // 将图像数据传递给 WebAssembly 模块
          const palette = Module._extract_palette(imageData.data, imageData.width, imageData.height);
          
          console.log('Extracted Palette:', palette);
          alert('Palette Extracted: ' + palette.join(', '));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  });
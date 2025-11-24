// src/utils/camera-fix.js - إصلاح مشكلة الكاميرا في Android
export const initializeCameraSafe = async (videoElement) => {
  try {
    // التحقق من دعم الكاميرا
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('الكاميرا غير مدعومة في هذا المتصفح');
    }

    // طلب صلاحيات الكاميرا أولاً
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
    } catch (permissionError) {
      console.warn('❌ Camera permission denied:', permissionError);
      throw new Error('تم رفض إذن الكاميرا. يرجى السماح بالوصول إلى الكاميرا في إعدادات التطبيق.');
    }

    // خيارات الكاميرا المبسطة
    const constraints = {
      video: {
        facingMode: 'environment',
        width: { ideal: 640 },
        height: { ideal: 480 }
      },
      audio: false
    };

    // الحصول على stream الكاميرا
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    
    if (!stream) {
      throw new Error('فشل في الحصول على stream الكاميرا');
    }

    // تعيين stream لعنصر الفيديو
    if (videoElement) {
      videoElement.srcObject = stream;
      
      // الانتظار حتى يكون الفيديو جاهزاً
      await new Promise((resolve, reject) => {
        videoElement.onloadedmetadata = () => {
          videoElement.play()
            .then(resolve)
            .catch(reject);
        };
        
        videoElement.onerror = reject;
        
        // مهلة السلامة
        setTimeout(() => reject(new Error('انتهت مهلة تحميل الفيديو')), 10000);
      });
    }

    return stream;
    
  } catch (error) {
    console.error('❌ Camera initialization failed:', error);
    throw error;
  }
};

export const stopCameraSafe = (videoElement) => {
  try {
    if (videoElement && videoElement.srcObject) {
      const tracks = videoElement.srcObject.getTracks();
      tracks.forEach(track => {
        track.stop();
        console.log('⏹️ Stopped track:', track.kind);
      });
      videoElement.srcObject = null;
    }
  } catch (error) {
    console.error('❌ Error stopping camera:', error);
  }
};
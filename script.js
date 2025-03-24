// 等待 DOM 加载完成
document.addEventListener('DOMContentLoaded', () => {
  // 获取 DOM 元素
  const apiKeyInput = document.getElementById('api-key-input');
  const apiUrlInput = document.getElementById('api-url-input');
  const saveApiKeyBtn = document.getElementById('save-api-key-btn');
  const fileUpload = document.getElementById('file-upload');
  const translateBtn = document.getElementById('translate-btn');
  const transcriptionDiv = document.getElementById('transcription');
  const translationDiv = document.getElementById('translation');
  const translationDivGPT = document.getElementById('translationGPT');
  const progressContainer = document.getElementById('progress-container');
  const progressBar = document.getElementById('progress-bar');
  const progressStatus = document.getElementById('progress-status');

  // 验证所有必需的 DOM 元素是否存在
  const elements = {
    apiKeyInput,
    apiUrlInput,
    saveApiKeyBtn,
    fileUpload,
    translateBtn,
    transcriptionDiv,
    translationDiv,
    translationDivGPT,
    progressContainer,
    progressBar,
    progressStatus
  };

  // 检查是否有任何元素未找到
  const missingElements = Object.entries(elements)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missingElements.length > 0) {
    console.error('未找到以下 DOM 元素:', missingElements);
    return;
  }

  // 尝试从 local storage 中加载配置
  const apiKey = localStorage.getItem('apiKey');
  if (apiKey) {
    apiKeyInput.value = apiKey;
  }
  const apiUrl = localStorage.getItem('apiUrl') || 'https://api.openai.com';
  if (apiUrl) {
    apiUrlInput.value = apiUrl;
  }

  // 监听保存配置按钮点击事件
  saveApiKeyBtn.addEventListener('click', () => {
    try {
      const apiKey = apiKeyInput.value.trim();
      const apiUrl = apiUrlInput.value.trim() || 'https://api.openai.com';
      
      if (!apiKey) {
        alert('请输入 API Key！');
        return;
      }
      
      // 验证 URL 格式
      try {
        new URL(apiUrl);
      } catch (e) {
        alert('请输入有效的 API URL！');
        return;
      }
      
      // 保存配置到 local storage
      localStorage.setItem('apiKey', apiKey);
      localStorage.setItem('apiUrl', apiUrl);
      
      // 显示详细信息的弹窗
      const keyLastFour = apiKey.slice(-4); // 获取 API key 的最后四位
      alert(`配置保存成功！\n\nAPI URL: ${apiUrl}\nAPI Key: ******${keyLastFour}`);
    } catch (error) {
      console.error('保存配置时出错:', error);
      alert('保存配置失败，请查看控制台获取详细信息。');
    }
  });

  // 更新进度条
  const updateProgress = (percentage, status) => {
    progressBar.style.width = `${percentage}%`;
    progressStatus.textContent = status;
  };

  // 发送音频文件和 API key 到服务器进行转写
  const transcribeAudio = async (apiKey, apiUrl, file) => {
    updateProgress(25, '正在转写音频...');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('model', 'whisper-1');
    const response = await fetch(`${apiUrl}/v1/audio/transcriptions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`
      },
      body: formData
    });
   
    if (response.ok) {
      const responseData = await response.json();
      updateProgress(50, '音频转写完成');
      return responseData.text;
    } else {
      const errorResponse = await response.text();
      alert(`Error: ${response.status} \n\n${errorResponse}`);
      updateProgress(0, '转写失败');
      throw new Error(errorResponse);
    }
  };

  // 使用 Google translate API 将文本翻译成中文
  const translateText = async (text) => {
    updateProgress(60, '使用 Google 翻译中...');
    
    // 对 text 进行 url 编码
    const encodedText = encodeURIComponent(text);

    // 调用 Google translate 的 get api 将原始文本翻译成 Chinese
    const translateResponse = await fetch(`https://translate.googleapis.com/translate_a/single?dt=t&dt=bd&dt=qc&dt=rm&client=gtx&sl=auto&tl=zh-CN&hl=en-US&dj=1&q=${encodedText}&tk=574558.574558`);
    
    if (translateResponse.ok){
      const translateResponseData = await translateResponse.json();
      // 提取 sentences[*].trans 并合并为一行
      const translation = translateResponseData.sentences.map(sentence => sentence.trans).join('');
      updateProgress(75, 'Google 翻译完成');
      return translation;
    } else {
      const errorResponse = await translateResponse.text();
      alert(`Error: ${translateResponse.status} \n\n${errorResponse}`);
      throw new Error(errorResponse);
    }
  };

  // 使用 GPT-4 将文本翻译成中文
  const translateTextGPT = async (text) => {
    updateProgress(85, '使用 GPT-4 翻译中...');
    
    // 构造请求消息，要求模型翻译 text
    const requestBody = {
      "model": "gpt-4o",
      "messages": [
        {
          "role": "system",
          "content": "I want you to act as an Chinese translator, spelling corrector and improver. I will speak to you in any language and you will detect the language, translate it and answer in the corrected and improved version of my text, in Chinese. I want you to only reply the correction, the improvements and nothing else, do not write explanations"
        },
        {
          "role": "user",
          "content": `"${text}"`
        }
      ]
    };

    const response = await fetch(`${apiUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (response.ok) {
      const responseData = await response.json();
      updateProgress(100, '所有翻译完成');
      return responseData.choices[0].message.content.trim();
    } else {
      const errorResponse = await response.text();
      alert(`Error: ${response.status} \n\n${errorResponse}`);
      throw new Error(errorResponse);
    }
  };

  async function convertOggToMp3(file) {
    updateProgress(15, '转换音频格式...');
    
    // 加载FFmpeg
    if (!ffmpeg.isLoaded()) {
      await ffmpeg.load();
    }

    const { name } = file;
    const inputPath = `/${name}`;
    const outputPath = `/${name.replace('.ogg', '')}.mp3`;

    // 将OGG文件从File对象转换为Uint8Array格式
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // 将Uint8Array格式的文件写入FFmpeg内存中
    await ffmpeg.FS('writeFile', inputPath, uint8Array);

    // 调用FFmpeg进行转换
    await ffmpeg.run('-i', inputPath, '-acodec', 'libmp3lame', outputPath);

    // 将转换后的MP3文件从FFmpeg内存中读取到Uint8Array格式中
    const mp3Data = await ffmpeg.FS('readFile', outputPath);
    const mp3File = new File([mp3Data.buffer], name.replace('.ogg', '.mp3'), { type: 'audio/mp3' });

    return mp3File;
  }

  translateBtn.addEventListener('click', async () => {
    try {
      // 从 local storage 中加载 API key
      const apiKey = localStorage.getItem('apiKey');
      if (!apiKey) {
        alert('请先输入并保存 API key！');
        return;
      }

      const apiUrl = localStorage.getItem('apiUrl');
      if (!apiUrl) {
        alert('请先设置 API URL！');
        return;
      }

      // 从文件上传控件中获取文件
      const file = fileUpload.files[0];
      if (!file) {
        alert('请选择一个音视频文件！');
        return;
      }

      if (file.size > 25 * 1024 * 1024) {
        alert('文件大小不能超过 25MB！');
        return;
      }

      // 重置显示区域
      transcriptionDiv.innerText = '';
      translationDiv.innerText = '';
      translationDivGPT.innerText = '';
      
      // 显示进度条并初始化
      progressContainer.style.display = 'block';
      updateProgress(5, '准备处理文件...');
      
      // 禁用翻译按钮
      translateBtn.disabled = true;
      translateBtn.textContent = '处理中...';

      let transcription;

      try {
        if (file.type === 'audio/ogg') {
          document.title = '音频翻译-ogg 转换较慢，请耐心等待';
          // 将OGG文件转换为MP3格式
          const mp3File = await convertOggToMp3(file);
          // 转写音频
          transcription = await transcribeAudio(apiKey, apiUrl, mp3File);
        } else {
          // 直接转写音频
          transcription = await transcribeAudio(apiKey, apiUrl, file);
        }

        // 立即显示转写结果
        transcriptionDiv.innerText = transcription;

        // 并行处理两种翻译
        const translationPromises = [
          translateText(transcription),
          translateTextGPT(transcription)
        ];

        // 获取 Google 翻译结果
        translationPromises[0].then(translation => {
          translationDiv.innerText = translation;
        }).catch(error => {
          console.error('Google 翻译失败:', error);
          translationDiv.innerText = '翻译失败: ' + error.message;
        });

        // 获取 GPT 翻译结果
        translationPromises[1].then(translationGPT => {
          translationDivGPT.innerText = translationGPT;
        }).catch(error => {
          console.error('GPT 翻译失败:', error);
          translationDivGPT.innerText = '翻译失败: ' + error.message;
        });

        // 等待所有翻译完成
        await Promise.allSettled(translationPromises);
        updateProgress(100, '处理完成');

      } catch (error) {
        console.error('处理过程出错:', error);
        updateProgress(0, '处理失败');
        alert(`处理失败: ${error.message}`);
      } finally {
        // 恢复按钮状态
        translateBtn.disabled = false;
        translateBtn.textContent = '翻译';
        document.title = '音频翻译';
      }
    } catch (error) {
      console.error('总体处理失败:', error);
      alert(`操作失败: ${error.message}`);
      
      // 恢复按钮状态
      translateBtn.disabled = false;
      translateBtn.textContent = '翻译';
      // 隐藏进度条
      progressContainer.style.display = 'none';
    }
  });
});


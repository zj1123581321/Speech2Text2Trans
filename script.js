const apiKeyInput = document.getElementById('api-key-input');
const apiUrlSelect = document.getElementById('api-url-select');
const saveApiKeyBtn = document.getElementById('save-api-key-btn');
const fileUpload = document.getElementById('file-upload');
const translateBtn = document.getElementById('translate-btn');
const transcriptionDiv = document.getElementById('transcription');
const translationDiv = document.getElementById('translation');

// 尝试从 local storage 中加载 API key
const apiKey = localStorage.getItem('apiKey');
if (apiKey) {
  apiKeyInput.value = apiKey;
}
const apiUrl = localStorage.getItem('apiUrl');
if (apiUrl) {
  apiUrlSelect.value = apiUrl;
}

// 监听保存 API key 的按钮点击事件
saveApiKeyBtn.addEventListener('click', () => {
  // 从输入框中获取 API key
  const apiKey = apiKeyInput.value;
  const apiUrl = apiUrlSelect.value;
  
  // 保存 API key 到 local storage
  localStorage.setItem('apiKey', apiKey);
  localStorage.setItem('apiUrl', apiUrl);
  
  // 提示用户保存成功
  alert('配置保存成功！');
});

// 发送音频文件和 API key 到 https://api.openai.com/v1/audio/translations 进行翻译
const transcribeAudio = async (apiKey,apiUrl,file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('model', 'whisper-1');
  const response = await fetch(`${apiUrl}/v1/audio/translations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`
    } ,
    body: formData
  });
 
  if (response.ok) { // 检查 status code 是否为 200
    const responseData = await response.json();
    return responseData.text;
    } else {
    const errorResponse = await response.text();
    alert(`Error: ${response.status} \n\n${errorResponse}`);
    }
};

const translateText = async (text) => {
  // 对 text 进行 url 编码
  const encodedText = encodeURIComponent(text);

  // 调用 Google translate 的 get api 将 English 翻译成 Chinese
  const translateResponse = await fetch(`https://translate.googleapis.com/translate_a/single?dt=t&dt=bd&dt=qc&dt=rm&client=gtx&sl=auto&tl=zh-CN&hl=en-US&dj=1&q=${encodedText}&tk=574558.574558`);
  
  if (translateResponse.ok){
    const translateResponseData = await translateResponse.json();
    // 提取 sentences[*].trans 并合并为一行
    const translation = translateResponseData.sentences.map(sentence => sentence.trans).join('');
    return translation;
  } else {
    const errorResponse = await translateResponse.text();
    alert(`Error: ${response.status} \n\n${errorResponse}`);
  }
  
};

async function convertOggToMp3(file) {
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
  // 从 local storage 中加载 API key
  const apiKey = localStorage.getItem('apiKey');
  if (!apiKey) {
    alert('请先输入并保存 API key！');
    return;
  }

  // 从文件上传控件中获取文件,File uploads are currently limited to 25 MB and the following input file types are supported: mp3, mp4, mpeg, mpga, m4a, wav, and webm.
  const file = fileUpload.files[0];
  if (!file) {
    alert('请选择一个音视频文件！');
    return;
  }

  if (file.size > 25 * 1024 * 1024) {
    alert('文件大小不能超过 25MB！');
    return;
  }

  let transcription;

  if (file.type === 'audio/ogg') {
    // 更改 Tab 的标题为"ogg 转换较慢，请耐心等待"
    document.title = '音频翻译-ogg 转换较慢，请耐心等待';
    // 将OGG文件转换为MP3格式
    const mp3File = await convertOggToMp3(file);
    // 调用openai和google translate完成音频翻译
    transcription = await transcribeAudio(apiKey,apiUrl, mp3File);
  } else {
    // 直接调用openai和google translate完成音频翻译
    transcription = await transcribeAudio(apiKey,apiUrl, file);
  }

  const translation = await translateText(transcription);

  // 在页面上显示转写结果和翻译结果
  transcriptionDiv.innerText =  transcription;
  translationDiv.innerText = translation;
});


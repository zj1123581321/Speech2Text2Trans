const apiKeyInput = document.getElementById('api-key-input');
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

// 监听保存 API key 的按钮点击事件
saveApiKeyBtn.addEventListener('click', () => {
  // 从输入框中获取 API key
  const apiKey = apiKeyInput.value;
  
  // 保存 API key 到 local storage
  localStorage.setItem('apiKey', apiKey);
  
  // 提示用户保存成功
  alert('API key 保存成功！');
});

translateBtn.addEventListener('click', async () => {
  // 从 local storage 中加载 API key
  const apiKey = localStorage.getItem('apiKey');
  if (!apiKey) {
    alert('请先输入并保存 API key！');
    return;
  }
  
  // 从文件上传控件中获取音频文件
  const file = fileUpload.files[0];

  // 调用 https://api.openai.com/v1/audio/translations 完成音频翻译

  // 发送音频文件和 API key 到 https://api.openai.com/v1/audio/translations 进行翻译
  const formData = new FormData();
  formData.append('file', file);
  formData.append('model', 'whisper-1');
  const response = await fetch('https://api.openai.com/v1/audio/translations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`
    } ,
    body: formData
  });
 
  // 提取 whisper 识别的 English 文本
  const responseData = await response.json();
  transcriptionDiv.innerText =  responseData.text;
  
  // 调用 Google translate 的 get api 将 English 翻译成 Chinese
  // 对 responseData.text 进行  url 编码
  const encodedText = encodeURIComponent(responseData.text);
  const translateResponse = await fetch(`https://translate.googleapis.com/translate_a/single?dt=t&dt=bd&dt=qc&dt=rm&client=gtx&sl=auto&tl=zh-CN&hl=en-US&dj=1&q=${encodedText}&tk=574558.574558`);
  const translateResponseData = await translateResponse.json();
  console.log(translateResponseData);
  // 提取 sentences[*].trans 并合并为一行
  const translation = translateResponseData.sentences.map(sentence => sentence.trans).join('');

  // 在页面上显示转写结果和翻译结果
  translationDiv.innerText = translation;
});
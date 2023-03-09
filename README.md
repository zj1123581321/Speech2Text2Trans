## Speech2Text2Trans
Call whisper api to finish transcribing audio to English, call google translate api to finish translating English to Chinese.
用户上传音视频文件，网页会调用 Whipser Api 将其转录为英文文本，然后再调用 Google Translate API 将英文文本翻译为中文。

## 使用场景
- 从 Whatsapp Web 下载语音文件，查看转写结果
- 下载视频素材，查看口播文案

## 怎样获取 OpenAI API key
- 在你拥有一个 OpenAI 账号(即 Chatgpt 账号)之后，打开 https://platform.openai.com/account/api-keys 网址
- 点击『Create new secret key』。
- 这个 key 只会出现一次，请自行保存好。

![API key](https://s1.ax1x.com/2023/03/08/ppmm881.md.png)

## 当前支持语言
Afrikaans, Arabic, Armenian, Azerbaijani, Belarusian, Bosnian, Bulgarian, Catalan, Chinese, Croatian, Czech, Danish, Dutch, English, Estonian, Finnish, French, Galician, German, Greek, Hebrew, Hindi, Hungarian, Icelandic, Indonesian, Italian, Japanese, Kannada, Kazakh, Korean, Latvian, Lithuanian, Macedonian, Malay, Marathi, Maori, Nepali, Norwegian, Persian, Polish, Portuguese, Romanian, Russian, Serbian, Slovak, Slovenian, Spanish, Swahili, Swedish, Tagalog, Tamil, Thai, Turkish, Ukrainian, Urdu, Vietnamese, and Welsh.

## 文件大小与格式限制
- 文件上传目前限制为 25 MB，并且支持以下输入文件类型：mp3、mp4、mpeg、mpga、m4a、wav 和 webm。
- 也支持 Whatsapp 下载出来的 .opp 文件，**但是由于需要转码，耗时会稍久一点，请耐心等待**

## 价格：每分钟 0.006 $
- 折合人民币大概每分钟 0.04 元。
- 非常便宜，大概是 Google Cloud Speech2Text API 价格的 1/4。
- 每个 OpenAI 账号自带的 18$ 大概可以换算成 50 小时的转写时长。

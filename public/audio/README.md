# BLUFF Audio Assets

本目录为游戏的静态音频资源存放路径。

```
public/audio/
├── bgm/                  # 背景音乐 (mp3/ogg/wav)
│   ├── title-theme.mp3   # 主界面/大厅音乐
│   ├── battle-loop.mp3   # 常规对局音乐
│   └── boss-battle.mp3   # Boss 决战高危音乐
└── sfx/                  # 独立音效 (wav/mp3/ogg)
    ├── card-select.wav
    ├── card-play.wav
    ├── card-discard.wav
    ├── chip-clink.wav
    └── model-break.wav
```

### 降级机制 (Zero-Latency Procedural Fallback)
游戏内建 Web Audio API 原生程序化音效合成器 (`src/lib/audio/sfx-synth.ts`)。若未放置或尚未加载静态音频文件，系统将自动无缝使用纯代码合成的复古像素音效，保障零延迟、零网络依赖。

### 推荐免费/开源授权资源
- **扑克/筹码/UI音效**：[Kenney Casino & UI Audio (CC0 公有领域)](https://kenney.nl/assets/casino-audio)
- **赛博朋克 BGM**：[Karl Casey @ White Bat Audio](https://whitebataudio.com/) (免费署名使用)
- **公共领域免版权音乐**：[FreePD (100% CC0)](https://freepd.com/)

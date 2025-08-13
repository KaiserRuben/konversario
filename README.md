# Konversario - AI Personality Conversation Room

A Next.js application that allows you to engage in conversations with multiple historical, fictional, or contemporary personalities simultaneously using local AI models.

## ✨ Features

- **Multi-Character Conversations**: Talk to multiple AI personalities at once
- **Local AI**: Uses Ollama with the qwen3:32b model for complete privacy
- **Dynamic Orchestration**: AI determines who responds when and why
- **Character Authenticity**: Each personality maintains their unique worldview and speaking style
- **Real-time Chat Interface**: Modern chat UI with message history and typing indicators
- **Fallback System**: Works even when Ollama isn't available (with simplified responses)
- **Conversation Context**: Maintains character consistency throughout long conversations

## 🚀 Quick Start

### Prerequisites

1. **Node.js** (v18 or later)
2. **Ollama** installed and running locally
3. **qwen3:32b model** downloaded

### Installation

1. **Install Ollama** (if not already installed):
   ```bash
   # macOS/Linux
   curl -fsSL https://ollama.com/install.sh | sh
   
   # Windows: Download from https://ollama.com/download
   ```

2. **Download the AI model**:
   ```bash
   ollama pull qwen3:32b
   ```

3. **Start Ollama server**:
   ```bash
   ollama serve
   ```

4. **Install project dependencies**:
   ```bash
   npm install
   ```

5. **Setup the database**:
   ```bash
   npx prisma migrate dev --name init
   ```

6. **Start the development server**:
   ```bash
   npm run dev
   ```

7. **Open your browser** to [http://localhost:3000](http://localhost:3000)

## 🎭 Example Conversations

Try these personality combinations:

- **Philosophy**: "Socrates, Nietzsche, and Buddha"
- **Science**: "Einstein, Marie Curie, and Tesla"
- **Literature**: "Shakespeare, Maya Angelou, and Oscar Wilde"
- **Fiction**: "Sherlock Holmes and Professor Moriarty"
- **Mixed Eras**: "A medieval knight and a space explorer"
- **Leaders**: "Gandhi, MLK, and Nelson Mandela"

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15 with App Router
- **UI**: shadcn/ui components with Tailwind CSS
- **Database**: SQLite with Prisma ORM
- **AI**: Ollama with qwen3:32b model
- **TypeScript**: Full type safety throughout

### Key Components

1. **LLM Service Layer** (`services/llm-service.ts`):
   - Character generation and personality management
   - Conversation orchestration
   - Response generation with fallbacks

2. **API Routes**:
   - `/api/rooms` - Create and list conversation rooms
   - `/api/rooms/[roomId]/messages` - Send messages and get responses
   - `/api/rooms/[roomId]` - Get room details

3. **Database Models**:
   - `ConversationRoom` - Stores room metadata and participants
   - `Message` - Stores all conversation messages with metadata

4. **AI Prompts** (`lib/prompts.ts`):
   - Character setup and generation
   - Conversation orchestration
   - Response generation templates

## ⚙️ Configuration

### Environment Variables

Create a `.env.local` file:

```env
OLLAMA_BASE_URL=http://localhost:11434
DATABASE_URL=file:./prisma/dev.db
```

### Ollama Configuration

The app is configured to use:
- **Model**: qwen3:32b (32 billion parameter model)
- **Temperature**: 0.8 (creative but coherent)
- **Context Window**: ~32k tokens
- **Timeout**: 60 seconds per request

## 🛠️ Development

### Project Structure

```
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   ├── room/[roomId]/     # Chat room page
│   └── page.tsx           # Home page
├── components/            # Reusable components
│   ├── ui/               # shadcn/ui components
│   └── message.tsx       # Message component
├── lib/                  # Utilities
│   ├── ollama.ts         # Ollama API integration
│   ├── prompts.ts        # AI prompts
│   └── prisma.ts         # Database client
├── services/             # Business logic
│   └── llm-service.ts    # LLM service layer
├── types/                # TypeScript definitions
└── prisma/               # Database schema and migrations
```

### Key Features Implemented

1. ✅ **Character Generation**: Dynamic personality creation from user input
2. ✅ **Conversation Orchestration**: AI decides who speaks when
3. ✅ **Multi-party Exchanges**: Characters can talk to each other
4. ✅ **Error Handling**: Comprehensive fallbacks for AI failures
5. ✅ **Real-time UI**: Modern chat interface with typing indicators
6. ✅ **Context Management**: Maintains conversation history and character state

### Adding New Features

- **Voice Integration**: Add ElevenLabs for character voices
- **Avatar Generation**: Create visual representations of characters
- **Export Options**: Save conversations as markdown/PDF
- **Advanced Context**: Implement conversation compression for very long chats

## 🔧 Troubleshooting

### Common Issues

1. **"Model not found" error**:
   ```bash
   ollama pull qwen3:32b
   ```

2. **"Connection refused" error**:
   ```bash
   ollama serve
   ```

3. **Out of memory**: The qwen3:32b model requires ~24GB RAM

4. **Slow responses**: This is normal for large models on consumer hardware

### Performance Tips

- **RAM**: Ensure you have at least 24GB RAM for smooth operation
- **SSD**: Store the model on an SSD for faster loading
- **Background apps**: Close unnecessary applications to free memory
- **Alternative models**: Try `llama3.1:8b` for faster responses (less creative)

## 📝 API Documentation

### Create Room
```http
POST /api/rooms
Content-Type: application/json

{
  "userInput": "Einstein, Van Gogh, and Socrates",
  "focus": "The relationship between art and science"
}
```

### Send Message
```http
POST /api/rooms/{roomId}/messages
Content-Type: application/json

{
  "content": "What inspires your greatest work?"
}
```

## 🙏 Acknowledgments

- **Ollama** for making local LLMs accessible
- **Alibaba Cloud** for the qwen3 model family
- **Vercel** for Next.js and hosting
- **shadcn/ui** for beautiful components

---

**Note**: This application runs entirely locally and does not send your conversations to any external servers. Your privacy is completely protected.
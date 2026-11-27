# NLW Agents API

This Fastify API answers questions about audio uploaded to a room. It transcribes the audio, stores embeddings in PostgreSQL with pgvector, and gives the answer model the most similar excerpts from the room. It can run against local inference servers, hosted OpenAI-compatible endpoints, or the Gemini API.

## Demo: ask a question about a coffee recipe

The local run used **Whisper Small** for transcription, **EmbeddingGemma 300M Q8_0** for embeddings, and **Qwen 3.5 4B Q4_K_M** for the answer. All three models ran on CPU. The sample contains synthetic Brazilian Portuguese speech. [Download the sample WAV](docs/assets/coffee-demo.wav)

I created the room with `POST /rooms` and the payload below. The response was `201 Created` with `{"room":"4cf7c099-66af-4d5d-b537-d5d4d76904f5"}`.

```json
{"name":"Coffee Lab Offline","description":"A Portuguese sample about making coffee"}
```

Uploading the WAV as multipart field `audio` to `POST /rooms/4cf7c099-66af-4d5d-b537-d5d4d76904f5/audio` returned `201 Created`. The response is shown below with the 768-element `embeddings` array omitted.

```json
{
  "chunkId": "5439794c-d0f5-4ab8-b769-fcabd7d3f854",
  "transcription": "Para preparar o café, use 15 gramas de café e 250 ml de\n água."
}
```

That transcription was the only matching excerpt. PostgreSQL reported a cosine similarity of **0.7030**, above the route's **0.7** cutoff. The question and actual answer were:

```http
POST /rooms/4cf7c099-66af-4d5d-b537-d5d4d76904f5/questions
Content-Type: application/json

{"question":"Para preparar o café, quantos gramas de café e quantos mililitros de água devo usar?"}
```

```http
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8

{"question":"fc785602-4e22-40c0-9c2f-dcb8aab3d70b","answer":"Para preparar o café, você deve usar 15 gramas de café e 250 ml de água."}
```

`GET /rooms/:roomId/questions` returned `200 OK` with the stored question and answer. The same question returned `404` with `{"message":"No similar audio chunks found"}` before the WAV was uploaded and in a separate room containing only a legacy-space vector.

## Prerequisites

- Node.js 24, npm, `curl`, and `jq`.
- PostgreSQL with pgvector. Docker Compose supplies PostgreSQL 17. The recorded run used PostgreSQL 18 with pgvector.
- For the local demo, install `llama-server`, `whisper-server`, and FFmpeg. Download the three model files or reuse your existing copies. [llama.cpp](https://github.com/ggml-org/llama.cpp/releases) · [whisper.cpp](https://github.com/ggml-org/whisper.cpp) · [Qwen GGUF](https://huggingface.co/ggml-org/Qwen3.5-4B-GGUF) · [EmbeddingGemma GGUF](https://huggingface.co/ggml-org/embeddinggemma-300M-GGUF) · [Whisper Small weights](https://huggingface.co/ggerganov/whisper.cpp/blob/main/ggml-small.bin)

## Environment variables

Copy `example.env` to `.env`. The example selects local endpoints and needs no API credentials.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL URL. The example matches Docker Compose. |
| `PORT` | HTTP port, default `3333`. |
| `AI_PROVIDER` | `openai-compatible` for local or hosted HTTP endpoints. `gemini` selects the native Gemini API and is the default if this variable is unset. |
| `AI_CHAT_URL`, `AI_CHAT_MODEL`, `AI_CHAT_API_KEY` | Full Chat Completions URL and model ID. Set the key only when the endpoint requires Bearer authentication. |
| `AI_EMBEDDING_URL`, `AI_EMBEDDING_MODEL`, `AI_EMBEDDING_API_KEY` | Full Embeddings URL, model ID, and optional Bearer key. The response must contain a 768-dimensional vector. |
| `AI_EMBEDDING_FORMAT`, `AI_EMBEDDING_DIMENSIONS` | Set the format to `embeddinggemma` for its retrieval prefixes, or `plain` for raw text. Set dimensions to `768` when the host supports requesting a shortened vector. |
| `AI_EMBEDDING_SPACE` | Optional versioned identifier for the embedding deployment. Change it if you replace the weights behind the same endpoint and model ID. |
| `AI_TRANSCRIPTION_URL`, `AI_TRANSCRIPTION_MODEL`, `AI_TRANSCRIPTION_API_KEY` | Full transcription URL, model ID (default `whisper-1`), and optional Bearer key. |
| `AI_TRANSCRIPTION_FORMAT` | `multipart` for Whisper and OpenAI, or `base64-json` for OpenRouter. Base64 uploads require a supported file extension such as `.wav` or `.webm`. |
| `GEMINI_APIKEY`, `GEMINI_GENERATION_MODEL`, `GEMINI_EMBEDDING_MODEL` | Key and optional model overrides for Gemini mode. Defaults are `gemini-2.5-flash` and `gemini-embedding-001`. |

## Run the local demo

Start each model server in a separate terminal. Replace the paths with your downloaded files. The aliases and ports match `example.env`.

```bash
llama-server -m /path/to/Qwen3.5-4B-Q4_K_M.gguf \
  --alias qwen3.5-4b --host 127.0.0.1 --port 18081 \
  --ctx-size 2048 --parallel 1 --threads 4 --n-gpu-layers 0 --reasoning off

llama-server -m /path/to/embeddinggemma-300M-Q8_0.gguf \
  --alias embeddinggemma-300m-q8_0 --host 127.0.0.1 --port 18082 \
  --embeddings --ctx-size 2048 --parallel 1 --threads 2 --n-gpu-layers 0

whisper-server --model /path/to/ggml-small.bin --host 127.0.0.1 --port 18083 \
  --inference-path /v1/audio/transcriptions --language pt --threads 4 --no-gpu --convert
```

From the repository root:

```bash
npm ci
cp example.env .env
docker compose up -d
```

Once PostgreSQL is ready, apply the migrations and start the API.

```bash
node --env-file=.env node_modules/drizzle-kit/bin.cjs migrate
npm run dev
```

If using an existing PostgreSQL instance, update `DATABASE_URL` and run `docker/setup.sql` on that database to enable pgvector before migrating.

In another terminal at the repository root:

```bash
base=http://localhost:3333
room_id=$(curl -fsS --json \
  '{"name":"Coffee Lab Offline","description":"A Portuguese sample about making coffee"}' \
  "$base/rooms" | jq -er '.room')

curl -fsS -F 'audio=@docs/assets/coffee-demo.wav;type=audio/wav' \
  "$base/rooms/$room_id/audio" | jq '{chunkId, transcription, dimensions: (.embeddings | length)}'

curl -si --json \
  '{"question":"Para preparar o café, quantos gramas de café e quantos mililitros de água devo usar?"}' \
  "$base/rooms/$room_id/questions"

curl -fsS "$base/rooms/$room_id/questions" | jq
```

## Change models or providers

- **Gemma or another local chat model.** Serve it through an OpenAI-compatible Chat Completions endpoint and set `AI_CHAT_URL` and `AI_CHAT_MODEL` to the advertised URL and model ID. Keep the Whisper and embedding settings to reuse the local pipeline and the indexed audio.
- **OpenAI.** Set the compatible URLs to `https://api.openai.com/v1/chat/completions`, `https://api.openai.com/v1/embeddings`, and `https://api.openai.com/v1/audio/transcriptions`. Set the corresponding model IDs and API keys. For `text-embedding-3-small`, set the embedding format to `plain` and dimensions to `768`. Use `multipart` with a transcription model such as `gpt-transcribe`. [OpenAI embeddings](https://developers.openai.com/api/reference/resources/embeddings/methods/create/) · [OpenAI transcription](https://developers.openai.com/api/docs/guides/speech-to-text)
- **OpenRouter.** Use the desired operations under `https://openrouter.ai/api/v1` with their full paths, provider-qualified model IDs, and your OpenRouter key. Use `base64-json` for transcription. You can also point only chat at OpenRouter and keep local endpoints for embeddings and transcription. [OpenRouter chat](https://openrouter.ai/docs/api/api-reference/chat/send-chat-completion-request) · [OpenRouter embeddings](https://openrouter.ai/docs/api/api-reference/embeddings/create-embeddings) · [OpenRouter transcription](https://openrouter.ai/blog/tutorials/transcription-on-openrouter/)
- **Gemini.** Set `AI_PROVIDER=gemini` and `GEMINI_APIKEY`. Choose models your account can access. The original checkout used `text-embedding-004`, which Google shut down. [Gemini model deprecations](https://ai.google.dev/gemini-api/docs/deprecations#embedding-deprecated-models)

After changing `.env`, restart the server. Retrieval only searches vectors from the room and the current embedding space. Re-upload audio to index it after changing the embedding model or format. The migration preserves existing transcripts and legacy vectors under their old model identity.

The local workflow was verified end to end. The compatible adapter's Bearer headers and JSON transcription format were checked against a local test server with sample tokens. Hosted inference with paid credentials was outside that run.

## API endpoints

| Method | Route | Input and successful response |
| --- | --- | --- |
| GET | `/health` | `200` with `{"status":"ok"}` |
| GET | `/rooms` | `200` with rooms and their question counts |
| POST | `/rooms` | JSON with `name` and optional `description`. Returns `201` with `room` (UUID). |
| GET | `/rooms/:roomId/questions` | `200` with stored questions and answers, newest first |
| POST | `/rooms/:roomId/questions` | JSON with `question`. Returns `201` with `question` (UUID) and `answer`, or `404` if no matching excerpt qualifies. |
| POST | `/rooms/:roomId/audio` | Multipart audio file. Returns `201` with `chunkId`, `transcription`, and `embeddings`. |

## Attribution

Built during the NLW Agents workshop by [Rocketseat](https://rocketseat.com.br). The demo recording uses a synthetic [Piper Brazilian Portuguese voice](https://huggingface.co/rhasspy/piper-voices/tree/main/pt/pt_BR/faber/medium).

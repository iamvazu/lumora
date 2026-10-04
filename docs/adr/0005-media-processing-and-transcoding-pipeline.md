# ADR 0005: Media Processing and Transcoding Pipeline

## Status
Accepted

## Context
High-resolution media (video up to 5GB, photos up to 50MB) must be securely uploaded, checked for prohibited content / CSAM, transcoded to adaptive HLS bitrates (360p, 720p, 1080p), watermarked, and protected against unauthorized leaks.

## Decision
1. **Direct S3 Uploads:** API issues 15-minute presigned multipart S3 URLs to `uploads-raw`. Client uploads directly without proxying through Node.js API servers.
2. **Pre-publication Moderation & Quarantine:** Media remains in `uploaded` / `in_review` status until SHA-256 and pHash hash checks and classifiers approve the asset.
3. **Adaptive Bitrate HLS:** Videos are transcoded to multi-rendition HLS (360p, 720p, 1080p) stored in private bucket `media-processed`.
4. **Playback Security:** `GET /media/:id/playback` validates database entitlements and issues 10-minute signed playback URLs containing user ID binding and dynamic watermark overlays (`lumora.app / {userId}`).

## Consequences
- Zero backend memory bottleneck for large 5GB video uploads.
- Strict isolation prevents unapproved or non-consensual content from ever being returned to fans.

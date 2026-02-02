# Shared Code

This directory contains platform-agnostic code shared across iOS, Android, macOS, and tvOS builds.

## Structure

- `components/` - Reusable React Native components
- `hooks/` - Custom React hooks
- `lib/` - Utility functions, constants, and helpers

## Usage

Import shared code from this directory in your platform-specific implementations:

```typescript
import { formatPitch } from '../shared/lib/audio-utils'
import { useAudioAnalysis } from '../shared/hooks/useAudioAnalysis'
```

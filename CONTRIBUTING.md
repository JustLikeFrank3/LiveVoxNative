# Contributing to LiveVoxNative

Thank you for your interest in contributing to LiveVoxNative! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

Please be respectful and constructive in all interactions. We aim to maintain a welcoming and inclusive environment for all contributors.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/LiveVoxNative.git
   cd LiveVoxNative
   ```
3. **Add the upstream repository** as a remote:
   ```bash
   git remote add upstream https://github.com/JustLikeFrank3/LiveVoxNative.git
   ```
4. **Install dependencies**:
   ```bash
   npm install
   cd ios && pod install && cd ..
   ```

## Development Workflow

### Creating a Branch

Create a new branch for your feature or bug fix:
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

Use descriptive branch names:
- `feature/add-recording` - for new features
- `fix/audio-glitch` - for bug fixes
- `docs/update-readme` - for documentation updates
- `refactor/optimize-pitch-detection` - for code refactoring

### Making Changes

1. Make your changes in your branch
2. Test your changes thoroughly
3. Ensure the code follows the existing style
4. Write clear, concise commit messages

### Commit Messages

Use clear and descriptive commit messages:

```
Add feature: Real-time audio recording

- Implemented audio recording functionality
- Added start/stop recording controls
- Integrated with audio engine module
```

Good commit message format:
- First line: Brief summary (50 characters or less)
- Blank line
- Detailed explanation if necessary

### Testing Your Changes

Before submitting a pull request:

1. **Run the app on a device**:
   ```bash
   npm run ios
   ```

2. **Test all affected features**:
   - Start/stop audio monitoring
   - Switch audio devices
   - Test latency measurement
   - Check audio analysis (RMS, waveform, pitch)

3. **Test on different devices** if possible:
   - iPhone with different iOS versions
   - iPad
   - Devices with/without external audio hardware

### Submitting a Pull Request

1. **Update your branch** with the latest upstream changes:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Push your changes** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Create a Pull Request** on GitHub:
   - Go to your fork on GitHub
   - Click "New Pull Request"
   - Select your branch
   - Fill out the PR template with:
     - Clear description of changes
     - Screenshots/videos if UI changes
     - Testing done
     - Any breaking changes

4. **Respond to feedback**:
   - Address review comments
   - Make requested changes
   - Push updates to your branch

## Code Style Guidelines

### TypeScript/JavaScript

- Use TypeScript for type safety
- Follow existing code formatting
- Use meaningful variable and function names
- Add comments for complex logic
- Prefer functional components and hooks

Example:
```typescript
// Good
const calculatePitch = (frequency: number): string => {
  // Implementation
}

// Avoid
const cp = (f: number) => {
  // Implementation
}
```

### React Native Components

- Keep components focused and single-purpose
- Extract reusable components
- Use hooks for state management
- Follow React best practices

### Swift (Native Module)

- Follow Swift naming conventions
- Use proper error handling
- Add comments for complex audio processing
- Keep the module interface clean and minimal

## What to Contribute

### Bug Fixes

If you find a bug:
1. Check if an issue already exists
2. If not, create a new issue with:
   - Clear description of the bug
   - Steps to reproduce
   - Expected vs actual behavior
   - Device/OS information
   - Screenshots if applicable
3. Submit a PR with the fix, referencing the issue

### New Features

Before working on a new feature:
1. Open an issue to discuss the feature
2. Wait for maintainer feedback
3. Once approved, implement the feature
4. Submit a PR with:
   - Implementation
   - Documentation updates
   - Examples of usage

### Documentation

Documentation improvements are always welcome:
- Fix typos or unclear explanations
- Add examples
- Improve API documentation
- Add troubleshooting guides

### Performance Improvements

- Profile before and after changes
- Provide benchmarks if applicable
- Explain the optimization approach

## Areas for Contribution

Here are some areas where contributions would be especially valuable:

### Features
- Android support for the audio engine
- Audio recording/playback
- Audio effects (reverb, echo, etc.)
- Frequency spectrum visualization
- Metronome functionality
- Audio file import/export

### Improvements
- Performance optimization
- Battery usage optimization
- UI/UX enhancements
- Better error handling
- Accessibility improvements

### Documentation
- More usage examples
- Video tutorials
- API reference improvements
- Troubleshooting guides

### Testing
- Unit tests for utility functions
- Integration tests
- Performance tests

## Native Module Development

If you're contributing to the `expo-audio-engine` module:

### iOS Development

1. **Open the iOS workspace**:
   ```bash
   cd ios
   open LiveVoxNative.xcworkspace
   ```

2. **Edit Swift code** in `modules/audio-engine/ios/AudioEngineModule.swift`

3. **Test changes** by running the app

4. **Follow iOS best practices**:
   - Use Grand Central Dispatch for threading
   - Properly manage memory
   - Handle audio session interruptions
   - Follow Apple's audio guidelines

### Module API Design

When adding new module functions:
- Keep the JavaScript API simple and intuitive
- Use TypeScript types
- Handle errors gracefully
- Document the API thoroughly
- Provide usage examples

## Getting Help

If you need help:
- Open an issue with your question
- Check existing documentation
- Review similar issues or PRs

## License

By contributing to LiveVoxNative, you agree that your contributions will be licensed under the MIT License.

## Recognition

Contributors will be recognized in the project's documentation and release notes.

Thank you for contributing to LiveVoxNative! 🎤🎵

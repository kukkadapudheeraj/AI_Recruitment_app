# 🤝 Contributing to AI Recruitment App

Thank you for your interest in contributing to the AI Recruitment App! This document provides guidelines and information for contributors.

## 🎯 Ways to Contribute

### 🐛 Bug Reports

- Use GitHub Issues to report bugs
- Include detailed reproduction steps
- Provide browser/environment information
- Add screenshots if applicable

### 💡 Feature Requests

- Describe the feature and its benefits
- Explain the use case and user story
- Consider implementation complexity
- Discuss with maintainers first for large features

### 📝 Code Contributions

- Fork the repository
- Create a feature branch
- Follow coding standards
- Add tests for new functionality
- Update documentation as needed

### 📚 Documentation

- Improve existing documentation
- Add examples and tutorials
- Fix typos and grammar
- Translate to other languages

## 🛠️ Development Setup

### Prerequisites

```bash
# Required tools
node --version    # v18+
npm --version     # v8+
git --version     # v2.20+
```

### Local Setup

```bash
# 1. Fork and clone
git clone https://github.com/yourusername/ai-recruitment-app.git
cd ai-recruitment-app

# 2. Install dependencies
cd ai-recruitment-app-regen/server
npm install

# 3. Setup environment
cp .env.example .env
# Add your OpenAI API key

# 4. Start development servers
npm run dev          # API server with hot reload
python3 -m http.server 8000  # Static file server
```

### Development Workflow

```bash
# 1. Create feature branch
git checkout -b feature/your-feature-name

# 2. Make changes and test
npm test
npm run lint

# 3. Commit changes
git add .
git commit -m "feat: add amazing feature"

# 4. Push and create PR
git push origin feature/your-feature-name
```

## 📋 Coding Standards

### JavaScript Style

```javascript
// ✅ Good: Use const/let, not var
const apiKey = process.env.OPENAI_API_KEY;
let userInput = "";

// ✅ Good: Descriptive function names
function generateJobDescription(answers) {
  return aiService.createJobDescription(answers);
}

// ✅ Good: JSDoc comments
/**
 * Validates user input for job description
 * @param {Object} answers - User responses
 * @returns {Object} Validation results
 */
function validateAnswers(answers) {
  // Implementation
}

// ❌ Bad: Unclear naming
function doStuff(data) {
  var x = data.thing;
  return x;
}
```

### CSS Guidelines

```css
/* ✅ Good: Use CSS custom properties */
:root {
  --primary-color: #2563eb;
  --border-radius: 12px;
}

/* ✅ Good: BEM-like naming */
.job-description-builder {
  padding: var(--spacing-lg);
}

.job-description-builder__question {
  margin-bottom: var(--spacing-md);
}

/* ✅ Good: Mobile-first responsive */
.container {
  padding: 16px;
}

@media (min-width: 768px) {
  .container {
    padding: 32px;
  }
}
```

### File Organization

```
ai-recruitment-app-regen/
├── index.html              # Main HTML file
├── scripts/
│   ├── app.js              # Main application logic
│   ├── utils.js            # Utility functions
│   └── constants.js        # Application constants
├── styles/
│   ├── style.css           # Main styles
│   ├── components.css      # Component styles
│   └── responsive.css      # Media queries
├── server/
│   ├── server.js           # Express server
│   ├── routes/             # API routes
│   └── middleware/         # Custom middleware
└── docs/                   # Documentation
```

## 🧪 Testing Guidelines

### Manual Testing Checklist

- [ ] Job description generation works
- [ ] Sourcing strategy creation works
- [ ] User authentication flows
- [ ] Responsive design on mobile/tablet
- [ ] Cross-browser compatibility
- [ ] Error handling and edge cases

### Test Cases to Add

```javascript
// Example test structure
describe("Job Description Builder", () => {
  test("should generate valid job description", async () => {
    const answers = {
      role: "Software Engineer",
      location: "New York, NY",
      skills: ["JavaScript", "React"],
    };

    const result = await generateJobDescription(answers);
    expect(result).toContain("Software Engineer");
    expect(result).toContain("New York, NY");
  });
});
```

## 📝 Commit Message Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format: type(scope): description
feat(auth): add password strength validation
fix(ui): resolve mobile navigation issue
docs(readme): update installation instructions
style(css): improve button hover effects
refactor(api): simplify error handling logic
test(unit): add job description validation tests
chore(deps): update dependencies to latest versions
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

## 🔍 Code Review Process

### Before Submitting PR

- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] Documentation is updated
- [ ] No console.log statements in production code
- [ ] Error handling is implemented
- [ ] Performance considerations addressed

### PR Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Manual testing completed
- [ ] Cross-browser testing done
- [ ] Mobile responsiveness verified

## Screenshots

Add screenshots for UI changes

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
```

## 🚀 Release Process

### Version Numbering

We use [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist

- [ ] All tests pass
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped in package.json
- [ ] Git tag created
- [ ] Deployment tested

## 🌟 Recognition

### Contributors

All contributors are recognized in:

- README.md contributors section
- CONTRIBUTORS.md file
- Release notes
- Annual contributor appreciation

### Contribution Levels

- **🥉 Bronze**: 1-5 contributions
- **🥈 Silver**: 6-15 contributions
- **🥇 Gold**: 16+ contributions
- **💎 Diamond**: Major feature contributions

## 📞 Getting Help

### Communication Channels

- **GitHub Issues**: Technical questions and bugs
- **GitHub Discussions**: General questions and ideas
- **Discord**: Real-time chat (coming soon)
- **Email**: maintainers@ai-recruitment-app.com

### Mentorship Program

New contributors can request mentorship:

- Pair programming sessions
- Code review guidance
- Architecture discussions
- Career advice

## 📚 Resources

### Learning Materials

- [JavaScript MDN Docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
- [CSS Grid Guide](https://css-tricks.com/snippets/css/complete-guide-grid/)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)

### Tools and Extensions

- **VS Code Extensions**:
  - ESLint
  - Prettier
  - Live Server
  - GitLens
- **Browser Extensions**:
  - React Developer Tools
  - Vue.js devtools
  - Lighthouse

## 🎉 Thank You!

Your contributions make this project better for everyone. Whether it's a small typo fix or a major feature, every contribution is valued and appreciated!

---

**Happy Coding! 🚀**

# PromptPulse — AI Prompt Engineering Workspace

PromptPulse is a developer-centric workbench designed for designing, variable-compiling, parameter-tuning, and testing AI prompts before putting them into production code or API pipelines.

![PromptPulse Status](https://img.shields.io/badge/Status-Live-success)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## 🚀 Live Demo

Explore the live workspace here: **[https://promptpulses.netlify.app]*

---

## ✨ Features

- **System & User Prompt Isolation**: Separate system instruction rules from user task execution logic.
- **Dynamic Variable Parser**: Automatically extracts `{{variable}}` template syntax into real-time input fields.
- **Model Parameter Tuning**: Fine-tune Temperature, Top-P, and Max Tokens across models (GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro).
- **Token & Cost Estimator**: Real-time token parsing and cost calculation based on selected LLM pricing rates.
- **Compiled Payload Viewer**: Generates clean, production-ready JSON payloads ready for API integration.
- **Prompt Library Management**: Filter, save, search by tags, and export/import full prompt libraries via JSON files.
- **Dark/Light Mode**: Full custom theme engine with persistent state storage.

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3 (Flexbox/Grid, Custom CSS Variables)
- **Scripting**: Modern ES6+ JavaScript (Regex Parsing, State Management, LocalStorage)
- **Icons**: FontAwesome 6.4

---

## 📁 Project Structure

```text
PromptPulse/
│
├── index.html          # Main HTML structure, grid layout, and modals
├── style.css           # Custom styling, dark/light themes, and UI rules
├── app.js              # Variable parser, parameter logic, state management, and export/import handlers
├── README.md           # Documentation
└── .gitignore          # System ignore rules
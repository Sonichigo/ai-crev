# crev

Install the CLI -  `npm i code-review-cli`

### Lint JavaScript files in the current directory with GPT-3 analysis
`crev --key YOUR_OPENAI_API_KEY`

### Lint a specific Python file with GPT-3 analysis
`crev --path path/to/file.py --key YOUR_OPENAI_API_KEY`

### Lint a Python directory without GPT-3 analysis (since no key is provided)
`crev --path path/to/python-project`

### Lint a specific JavaScript file
`crev --path path/to/file.js`

### Lint a specific Python files
`crev --path path/to/file.py`

### Lint a Go file
`crev --path path/to/file.go`

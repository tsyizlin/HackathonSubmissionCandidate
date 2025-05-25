Prerequisites:

Python 3 is installed

NPM is installed

aider-chat is installed using pip so it is available to run from the command line:

```
pip install aider-chat
```

The environment variable OPENROUTER_API_KEY is set with a valid openrouter API key with credits available (approximately $5 should be more than sufficient for app generation)

app_generator.sh is a bash script, so this will only run on linux or mac os. If you are running on windows, you can have an LLM create a windows version of this script.

Setup:

clone this repo.

install npm, python, and aider-chat.

run "./app_generator.sh" from your linux terminal.

When prompted, provide a full description of the app you want it to build for you.

When it is finished, test the app.

if there are further changes needed to finish the app, you can use aider to finish those:

> aider --weak-model openrouter/anthropic/claude-3-5-haiku-20241022 --edit-format diff --model openrouter/anthropic/claude-sonnet-4
> /add **/*.py **/*.js **/*.md **/*.html **/*.css **/*.sh **/*.yaml **/*.sql **/*.ts **/*.tsx
> Fix the part of the app that {description of problems}


# Video of App Generator in action:

[Video of app generator in action](https://github.com/tsyizlin/HackathonSubmissionCandidate/demo.mp4)

This video shows the app generator making a tic tac toe game from a simple prompt and a starting example app. The coding agent ran for about 5 minutes to create the app, and that section of the video is run in 2x speed. At the end, we show us testing the app. There is a cut between where we ran the coding agent and where we tested the app, where 2 fixing prompts were ran to get the tic tac toe game into a final working state.

# Premise of Code Agent

As of March 2025 with the release of Gemini 2.5 pro, as well as recent advances in AI Agent coding with high intelligence models from OpenAI such as o3 and o4-mini, we are able to one shot applications if we have some example code and proper docs.

By this, I mean that with proper documentation, someone who wants to use Waku can quickly integrate it into their app if they point their code agent to a knowledge base and sample code.

This will only get more easy as coding agents get exponentially better.

Therefore I will demonstrate this with the smartest LLM models available today.

I think that the most value I can provide to the Waku ecosystem, rather than building a trivial sample app, is to demonstrate the future of coding by making a system that makes it easy for a developer who is new to Waku to build a working app. New developers can use this system to quickly make whatever app they want.

If the developers of the Waku docs target their docs towards LLM usage, they can vastly improve the new developer experience, and through this make Waku be used by a lot more people.

# Description of how developing my hackathon entry went
Going into the hackathon, I spoke to Guru who said that I should use his sample app as a template to work from, because the waku docs had not been updated fully with the latest changes. This was not ideal, because I wasnt sure where I could trust the docs and where they might steer me wrong. 

My original plan was to use the docs and convert them into a condensed and summarized version that an AI LLM could work from to create and modify apps using Waku quickly, to let a developer use Waku without needing to fully understand the system themselves.

However, I felt that taking this path was risky, because if the docs were outdated, it might fail to properly code apps.

Instead, I took the sample app provided by Guru and ran it through an AI coding agent (Aider) using Gemini Pro 2.5 and Claude 4 Sonnet to refactor the sample app to separate the Waku code from the application code. This way the application code could be updated without touching the working Waku code. I refactored it as well to handle listening on multiple contentTopics and stripped out Codex and Wallet code, to give a coding agent the best chance of being able to one shot change the sample code into a whole different app, given simple instructions.

Testing and refactoring the app cost about $15-$20 of LLM usage with Gemini pro 2.5.

After I was happy with the new simplified and refactored sample app, I created an app generator script that would take a description of the new app, and create a project plan. Then it was instructed to repeatedly prompt a coding agent to modify the sample app until it had completed the project plan. Then I would test the sample app to see if it worked as expected. If so, it was a one shot app. If not, I would run specific fixes through the Aider coding agent (up to 3 corrections) such as "make sure it connects to Waku before polling for changes". 

Creating the app generator cost about $10-$15 of Gemini 2.5 Pro usage.

In this way I was able to completely change the sample app into new apps from the Waku Project Ideas list that was given as suggestions for what apps to build for the hackathon.

The starting example app:
A "confession board" and a "wisdom board", demonstrating anonymous messaging board using Waku messaging and persisting (semi ephemerally) to the Waku store

I was successfully able to 1-shot create apps using my app generator. Here are the apps I built without writing any code and just using the App Generator i made:

# (1) Adding password encryption to the confession board
This app modifies the sample app to add password encryption so all messages are shown as encrypted, but the user can decrypt messages using a password. 

This cost $0.68 to create.

https://replit.com/@MO58/HackathonSuccessfulAppPasswordEncrypted

It is deployed here:
https://hackathon-successful-app-password-encrypted-mo58.replit.app/

The github code is here:
https://github.com/tsyizlin/HackathonSuccessfulAppPasswordEncrypted

The log of the coding agent is hosted here:
https://text-host-hub-mo58.replit.app/content/471acf39-164f-4396-a1ff-07062083ddd8/display

Prompt used to generate this in one shot:
```
make a password based message system. the password that the user gives encrypts their message. any other user can subscribe to that topic, get the messages, and decode them by entering a topic and password.
```

# (2) Creating a Tic Tac Toe game
This demonstrates creating games with Waku messaging.
This created the game with one shot, but required 2 more prompts to correct the logic for Player O waiting for Player X first move.
This cost $2.50 cents to create with the most state of the art coding LLM. I wrote zero lines of code for this. Cost was higher for this one because full Waku documentation was included in the coding agent prompt.

It is deployed here:
https://hackathon-successful-app-tic-tac-mo58.replit.app/

The github code is here:
https://github.com/tsyizlin/HackathonSuccessfulAppTicTac

The log of the coding agent is hosted here:
https://text-host-hub-mo58.replit.app/content/2305734b-96ea-49d6-9dd3-b664ae32c6eb/display

Prompt used to generate this:
```
lets make a web based tic tac toe game using the waku messaging protocol, so that people on different computers can play against each other if they are on the same contentTopic as each other. when a user makes a move, it gets broadcast, and then the other user sees it on their browser which is watching for those broadcasts, and then they are allowed to make a move back. make it follow the rules of tic tac toe. Carefully think through how this works so that they can play a game. Make sure that players can easily join the same game. person who starts the game gets X, gets a room link to give to other player, who will join as player O. X can play their first move even if player O hasnt joined yet. When O joins the link, they get player O and have to wait until it is their turn (X has moved) before they can play their first move. Turns go back and forth, usual tic tac toe stuff, just communication is through Waku.
```
# (3) A place where people can review twitter accounts, leaving a rating and comments. Allows anonymous review of twitter accounts in a censorship resistant way.

This cost $1.10 to create. I wrote zero lines of code for this. It required no corrections after the app generator run.

It is deployed here:
https://hackathon-successful-app-twitter-review-mo58.replit.app/

The github code is here:
https://github.com/tsyizlin/HackathonSuccessfulAppTwitterReview

The log of the coding agent is hosted here:
https://text-host-hub-mo58.replit.app/content/fc299a3b-6a2f-4d3f-ae8a-4e472dcda395/display

Prompt used to generate this in one shot:
```
Imagine a decentralized, privacy-preserving review board where anyone can anonymously rate and review Twitter accounts. Users effortlessly post short comments and ratings (1-10) for any given Twitter username, with each account's feedback organized on a unique Waku topic. Think out all the complexities of the app flow.
```

# 4 - Modified Sample App

Finally, I am also supplying the code for the coding agent script along with the simplified example app, through which others can potentially one-shot new apps. This was the base I used to create all the other apps.

https://github.com/tsyizlin/HackathonSubmissionCandidate

This sample app (confession board + wisdom board) is deployed here:

https://hackathon-submission-candidate-mo58.replit.app/

# App Generator Usage Instructions

This utility helps you generate applications by describing them to an LLM

## Prerequisites

Before you begin, ensure you have the following installed and configured:

*   **Python 3**
*   **NPM**
*   **aider-chat**: Install it using pip if you haven't already:
    ```bash
    pip install aider-chat
    ```
*   **OpenRouter API Key**: The environment variable `OPENROUTER_API_KEY` must be set with a valid OpenRouter API key.
    *   *Note: Ensure your API key has available credits. Approximately $5 should be more than sufficient for a typical app generation.*
*   **Bash Environment**: `app_generator.sh` is a bash script, designed to run on Linux or macOS.
    *   *Windows Users: You may need to use a Linux environment (like WSL) or have an LLM assist in converting `app_generator.sh` to a Windows-compatible script (e.g., a `.bat` or PowerShell script).*

## Setup & Usage

1.  **Clone Repository**:
    If you haven't already, clone the repository containing `app_generator.sh` to your local machine.

2.  **Navigate to Directory**:
    Open your terminal and change to the directory where you cloned the repository.

3.  **Run the Generator**:
    Execute the script:
    ```bash
    ./app_generator.sh
    ```

4.  **Describe Your App**:
    When prompted by the script, provide a detailed and full description of the application you want to build.

5.  **Test the App**:
    Once the script finishes, thoroughly test the generated application to ensure it meets your initial description.

## Iterating and Making Changes

If the generated app requires further modifications or bug fixes, you can use `aider` to refine it:

1.  **Start `aider`**:
    Launch `aider` from your terminal within the app's project directory. You can specify your preferred models. For example, to use Claude Haiku for context/smaller tasks and Claude Sonnet for main generation, with diff edit format:
    ```bash
    aider --weak-model openrouter/anthropic/claude-3-5-haiku-20241022 --edit-format diff --model openrouter/anthropic/claude-sonnet-4
    ```

2.  **Add Project Files to Context**:
    Once `aider` is running, add all relevant project files to the chat context. You can use a broad glob pattern like this (type this command into the `aider` prompt):
    ```
    /add **/*.py **/*.js **/*.md **/*.html **/*.css **/*.sh **/*.yaml **/*.sql **/*.ts **/*.tsx
    ```
    Adjust the pattern as needed to include all your source files.

3.  **Request Changes**:
    Clearly describe the problems or modifications you want to make. For example:
    ```
    Fix the part of the app that {your detailed description of problems or desired changes}
    ```
    Replace `{your detailed description...}` with your specific instructions. `aider` will then attempt to implement the changes.


# Recommended quick setup

Use replit, clone the repo to a new replit. install aider-chat on the replit. Then run from shell ./app_generator.sh
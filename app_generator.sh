#!/bin/bash

echo "Please describe how we should modify the example app to use Waku in a new way:"
read -r user_input

echo "$user_input" > project_goal.md

echo "Running with project_goal.md..."
python3 generate_project_plan.py project_goal.md

echo "Project plan generated. Now running Aider..."
rm .aiderchathistory.md

# Function to extract new files from aider chat history
get_new_files() {
    if [ -f ".aiderchathistory.md" ]; then
        # Look for pattern: filename followed by "Create new file?"
        tail -n 100 .aiderchathistory.md | grep -B1 "Create new file?" | grep -v "Create new file?" | grep -v "^--$" | sed 's/^[ \t]*//' | grep -v "^$" || true
    fi
}

# Base file list
BASE_FILES="docs/waku_full_docs.md waku-setup-readme.md pages/old-index(read-only).tsx lib/old-waku-app-config-(read-only).ts Sample_README.md components/common/status-toast.tsx components/file-transfer/file-list.tsx components/file-transfer/file-tabs.tsx components/file-transfer/file-upload-area.tsx components/header.tsx components/layout/main-layout.tsx components/settings/settings-sheet.tsx components/theme-provider.tsx components/theme-toggle.tsx components/ui/button.tsx components/ui/card.tsx components/ui/dialog.tsx components/ui/input.tsx components/ui/label.tsx components/ui/radio-group.tsx components/ui/sheet.tsx components/ui/sonner.tsx components/ui/switch.tsx components/ui/tabs.tsx components/ui/textarea.tsx components/ui/tooltip.tsx components/wallet-connect-button.tsx context/wallet-context.tsx hooks/useCodex.ts hooks/useTaco.ts hooks/useWaku.ts lib/utils.ts lib/waku-client.ts next.config.ts pages/_app.tsx pages/_document.tsx pages/api/codex/[...path].ts pages/api/hello.ts pages/index.tsx project_goal.md project_plan.md styles/globals.css lib/waku-app-config.ts"

# Initialize file list with base files
CURRENT_FILES="$BASE_FILES"

echo "Running first aider command..."
aider $CURRENT_FILES --message-file aider_command1.txt --model openrouter/anthropic/claude-sonnet-4 --yes-always --no-suggest-shell-commands --no-detect-urls --chat-history-file .aiderchathistory.md --weak-model openrouter/google/gemini-2.5-flash-preview --no-auto-lint

# Get any new files created in first command
NEW_FILES=$(get_new_files)
if [ ! -z "$NEW_FILES" ]; then
    echo "New files detected: $NEW_FILES"
    CURRENT_FILES="$CURRENT_FILES $NEW_FILES"
fi

# Run aider_command2 multiple times in a loop
for i in {2..5}; do
    echo "Running aider command $i..."
    aider $CURRENT_FILES --message-file aider_command2.txt --model openrouter/anthropic/claude-sonnet-4 --yes-always --no-suggest-shell-commands --no-detect-urls --restore-chat-history --chat-history-file .aiderchathistory.md --weak-model openrouter/google/gemini-2.5-flash-preview --no-auto-lint

    # Get any new files created in this command
    NEW_FILES=$(get_new_files)
    if [ ! -z "$NEW_FILES" ]; then
        echo "New files detected in command $i: $NEW_FILES"
        CURRENT_FILES="$CURRENT_FILES $NEW_FILES"
    fi
    
    # Check if aider indicated it's done
    if [ -f ".aiderchathistory.md" ]; then
        if grep -q "ALL DONE!" .aiderchathistory.md; then
            echo "Aider indicated completion with 'ALL DONE!' - stopping additional commands"
            break
        fi
    fi
done

echo "Process complete."

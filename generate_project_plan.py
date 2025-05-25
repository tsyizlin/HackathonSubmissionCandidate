from openai import OpenAI
import sys
import os

client = OpenAI(base_url="https://openrouter.ai/api/v1", api_key=os.environ["OPENROUTER_API_KEY"])

def generate_project_plan(project_goal_file):
    try:
        with open(project_goal_file, 'r') as f:
            project_goal = f.read()
    except FileNotFoundError:
        print(f"Error: Project goal file '{project_goal_file}' not found.")
        sys.exit(1)

    if not project_goal.strip():
        print("Error: Project goal file is empty. Please describe your project goal.")
        sys.exit(1)

    if not os.getenv("OPENROUTER_API_KEY"):
        print("Error: OPENROUTER_API_KEY environment variable not set.")
        sys.exit(1)

    sys_prompt = "You are an expert software architect and project planner. Your task is to create a detailed project plan for modifying the existing Waku application based on a user's high-level goal. The plan should include a markdown checklist of coding tasks (do not include testing or other non coding tasks in the checklist). Focus on actionable steps for the implementation team."

    user_prompt = f"We have already existing a sample app that is a webapp that is an anonymous 'confession board' where the user visits the website, and the site connects to a Waku peer, and then retrieves whatever messages are at a given topic, then displays them. The user can then broadcast messages to that topic. These messages they broadcast are also saved to the Waku Store. Other people that visit the website can then see the messages, because these messages are persisted to the Waku Store.\n\nWe want to modify this app based on the user's goal, so we need to make a plan for this. The user will ask for a whole different kind of app that makes use of the same decentralized messaging technology of Waku. We need to create a plan to convert the confession board app into the app that they are requesting. Here is the user's goal for modifying the existing Waku application:\n\n{project_goal}\n\nPlease generate a detailed project plan."


  
    print("Generating project plan with LLM...")

    response = client.chat.completions.create(
        model="google/gemini-2.5-flash-preview-05-20",  
        messages=[
            {"role": "system", "content": sys_prompt},
            {"role": "user", "content": user_prompt}
        ]
    )
    project_plan_content = str(response.choices[0].message.content)

    with open('project_plan.md', 'w') as f:
        f.write(project_plan_content)

    print("Project plan saved to project_plan.md")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 generate_project_plan.py <project_goal_file>")
        sys.exit(1)
    
    project_goal_file = sys.argv[1]
    generate_project_plan(project_goal_file)

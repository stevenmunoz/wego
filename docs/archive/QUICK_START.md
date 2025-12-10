# Quick Start Guide

## Step 1: Clone This Repository

```bash
git clone <your-repo-url> my-new-project
cd my-new-project
```

## Step 2: Generate the Project Structure

### Option A: Use Claude or GPT-4

1. Open `ENTERPRISE_PROJECT_TEMPLATE_PROMPT.md`
2. Copy the entire contents
3. Paste into your LLM of choice (Claude, ChatGPT, etc.)
4. The LLM will generate the complete project structure
5. Copy the generated files into your cloned repository

### Option B: Manual Customization

If you prefer to build incrementally:

1. Start with the backend structure
2. Set up the web client
3. Add the mobile client
4. Configure CI/CD

## Step 3: Customize for Your Project

1. **Update project name:**
   - Rename the root directory
   - Update `package.json` files
   - Update README.md

2. **Configure environment:**
   - Copy `.env.example` to `.env`
   - Set your database credentials
   - Configure API keys

3. **Initialize dependencies:**
   ```bash
   # Backend
   cd backend
   python -m venv venv
   source venv/bin/activate  # or `venv\Scripts\activate` on Windows
   pip install -r requirements.txt

   # Web
   cd ../web
   npm install

   # Mobile
   cd ../mobile
   npm install
   ```

## Step 4: Run Locally

```bash
# Start everything with Docker Compose
docker-compose up

# Or run individually:

# Backend
cd backend
uvicorn src.main:app --reload

# Web
cd web
npm run dev

# Mobile
cd mobile
npx expo start
```

## Step 5: Start Building

Now you have a production-ready foundation. Add your:

- Business logic in the domain layer
- API endpoints in the presentation layer
- UI components in your frontend
- Tests alongside your code

## Tips

- **Keep the architecture clean:** Respect the layer boundaries
- **Write tests first:** Maintain the >80% coverage standard
- **Document decisions:** Use ADRs (Architecture Decision Records)
- **Commit frequently:** Small, atomic commits with conventional commit messages

## Need Help?

- Check the `ENTERPRISE_PROJECT_TEMPLATE_PROMPT.md` for architectural details
- Review the generated sample feature (usually authentication)
- Open an issue if you find gaps in the template

Happy coding!

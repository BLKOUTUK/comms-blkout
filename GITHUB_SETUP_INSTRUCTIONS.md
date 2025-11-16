# GitHub Repository Setup Instructions

Since the GitHub API token doesn't have permission to create repositories, please follow these steps:

## Step 1: Create the Repository on GitHub

1. Go to: https://github.com/new
2. Fill in the following details:
   - **Repository name**: `comms-blkout`
   - **Description**: `BLKOUT UK Communications & Content Calendar System`
   - **Visibility**: ✓ Private
   - **DO NOT** initialize with README, .gitignore, or license (we already have these locally)
3. Click "Create repository"

## Step 2: Push the Code

After creating the repository, GitHub will show you a page with setup instructions. 

Since we already have a local repository with all commits, you just need to run:

```bash
cd /home/ubuntu/blkout_comms_app
git remote add origin https://github.com/BLKOUTUK/comms-blkout.git
git branch -M main
git push -u origin main
```

Or if you prefer to use the token for authentication:

```bash
cd /home/ubuntu/blkout_comms_app
git remote add origin https://ghu_tdym7Qmg20ByR1bUtbfVooztNZfw9D32EtXo@github.com/BLKOUTUK/comms-blkout.git
git branch -M main
git push -u origin main
```

## Repository Details

- **Name**: comms-blkout
- **Owner**: BLKOUTUK
- **URL**: https://github.com/BLKOUTUK/comms-blkout
- **Visibility**: Private
- **Description**: BLKOUT UK Communications & Content Calendar System

## What's Already Done

✓ Git repository initialized
✓ .gitignore created (excludes node_modules, .env, dist, etc.)
✓ All application files committed
✓ Ready to push to remote

## What's Included

- Complete Vite + React + TypeScript application
- Public Discover page
- Admin dashboard (calendar, drafts, agents, analytics, settings)
- Supabase integration
- Authentication disabled for development
- Responsive design with modern UI

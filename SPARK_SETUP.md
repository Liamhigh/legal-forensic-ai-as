# GitHub Spark Setup Guide

## Overview

This application is built on **GitHub Spark**, which provides AI-powered features through its LLM API. The chat functionality requires the Spark runtime to be properly configured.

## Why Chat Doesn't Work in Local Development

The chat feature relies on the GitHub Spark backend service, which is not available in standard local development environments. When you try to use the chat, you'll see an error message explaining this limitation.

## Features That Work Without Spark Backend

Even without the Spark backend, the following features still work:

- ✅ **Document Sealing** - Cryptographic sealing of evidence
- ✅ **PDF Generation** - Creating forensic reports with watermarks
- ✅ **Evidence Management** - Adding and tracking case evidence
- ✅ **Certificate Generation** - Creating forensic certificates
- ✅ **Case Export** - Exporting case narratives

## Features That Require Spark Backend

- ❌ **AI Chat** - Conversational analysis and legal research
- ❌ **Document Drafting** - AI-generated legal documents
- ❌ **Forensic Analysis** - AI-powered evidence analysis

## How to Enable Full Functionality

### Option 1: Deploy to GitHub Spark (Recommended)

1. Push your code to GitHub
2. Create a GitHub Spark application
3. Configure the Spark runtime with your repository
4. The Spark backend will automatically be available

### Option 2: Configure Spark Agent Locally

1. Set the `SPARK_AGENT_URL` environment variable:
   ```bash
   export SPARK_AGENT_URL=http://localhost:9000
   ```

2. Run the Spark agent service (requires GitHub Spark CLI):
   ```bash
   # This requires proper Spark credentials and setup
   spark-agent start
   ```

3. Start your development server:
   ```bash
   npm run dev
   ```

### Option 3: Modify Vite Config (Development Mode)

You can configure the Spark plugin in `vite.config.ts`:

```typescript
sparkPlugin({
  serverURL: process.env.SPARK_AGENT_URL || 'http://localhost:9000',
  agentDisabled: false
}) as PluginOption
```

## Environment Variables

- `SPARK_AGENT_URL` - URL of the Spark backend service (default: http://localhost:9000)
- `GITHUB_RUNTIME_PERMANENT_NAME` - GitHub runtime app name (set in runtime.config.json)
- `GITHUB_API_URL` - GitHub API URL (default: https://api.github.com)

## Configuration Files

- `runtime.config.json` - Contains the GitHub app ID
- `vite.config.ts` - Spark plugin configuration
- `spark.meta.json` - Spark template metadata

## Troubleshooting

### Error: "AI Service Connection Failed"

This means the Spark backend is not accessible. Solutions:
- Deploy to GitHub Spark
- Configure SPARK_AGENT_URL
- Run the Spark agent locally

### Error: "403 Forbidden" on /_spark/loaded

This indicates the Spark plugin is trying to connect but authentication failed. Ensure:
- You're running in a proper Spark environment
- Your runtime.config.json has the correct app ID
- The Spark agent has proper credentials

### Error: "500 Internal Server Error" on /_spark/llm

The Spark backend is not responding. Check:
- The Spark agent is running
- SPARK_AGENT_URL is correct
- Network connectivity to the backend

## Development Workflow

For local development without Spark backend:

1. Use the app for document sealing and PDF generation
2. Test the UI and case management features
3. Skip chat testing or mock the responses
4. Deploy to Spark for full AI functionality testing

## Production Deployment

For production use:

1. Deploy to GitHub Spark environment
2. Ensure runtime.config.json is properly configured
3. Test all AI features are working
4. Monitor Spark backend availability

## Additional Resources

- [GitHub Spark Documentation](https://github.com/features/spark)
- [Spark API Reference](https://docs.github.com/spark)
- Application README.md for general setup

## Support

If you encounter issues with Spark configuration:
1. Check the console for specific error messages
2. Verify environment variables are set
3. Review the vite.config.ts configuration
4. Contact GitHub Spark support for backend issues

FROM public.ecr.aws/docker/library/python:3.13-slim
WORKDIR /app

COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt

# Create non-root user
RUN useradd -m -u 1000 bedrock_agentcore
USER bedrock_agentcore

EXPOSE 8000

COPY . .

CMD ["python", "-m", "mcp_server"]

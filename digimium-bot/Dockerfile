FROM python:3.11-slim
WORKDIR /digimium-bot
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD [ "python", "digimium_dashboard.py" ]
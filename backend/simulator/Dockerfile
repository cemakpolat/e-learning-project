FROM python:3.9-slim-buster

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

#delay so the container start after the backend
CMD ["/bin/sh", "-c", "sleep 60 && python3 main.py"]
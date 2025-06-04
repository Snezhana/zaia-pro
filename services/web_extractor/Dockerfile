# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /wsextraction_service

# Copy the current directory contents into the container at /app
COPY . /wsextraction_service

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt


# Define environment variable
ENV NAME ZAIA-WS-EXTRACTOR

# Run the application
CMD ["python", "web_extractor.py", "local"]

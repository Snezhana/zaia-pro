import logging

import requests

class APIClient:
    
    def __init__(self, base_url, username, password):
        self.base_url = base_url
        self.logger = self.setLogger()
        
        self.session = requests.Session()
        (self.access_token, self.refresh_token) = self.login(username, password)
    
    def setLogger(self):
        log = logging.getLogger('Zaia_api')
        log.setLevel(logging.DEBUG)

        fh = logging.FileHandler('zaia.log')
        fh.setLevel(logging.DEBUG)

        ch = logging.StreamHandler()
        ch.setLevel(logging.DEBUG)

        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        fh.setFormatter(formatter)
        ch.setFormatter(formatter)

        log.addHandler(fh)
        log.addHandler(ch)

        return log
    
    def login(self, username, password):
        """Authenticate user and retrieve access and refresh tokens."""
        url = f"{self.base_url}/token"
        payload = {
            "username": username,
            "password": password
        }

        try:
            response = self.session.post(url, data=payload)
            response.raise_for_status()

            tokens = response.json()
            access_token = tokens.get('access_token')
            refresh_token = tokens.get('refresh_token')

            if not access_token or not refresh_token:
                raise Exception("Token retrieval failed: missing access_token or refresh_token")

            # Save tokens to the session headers or elsewhere (e.g., secure storage)
            self.session.headers.update({'Authorization': f'Bearer {access_token}'})
            return access_token, refresh_token

        except requests.exceptions.RequestException as e:
            self.logger.error(f"Login failed: {e}")
            return None, None
        
    def refresh_access_token(self):
        """Refresh the access token using the refresh token."""
        if not self.refresh_token:
            self.logger.error("No refresh token available. Please log in again.")
            return False

        url = f"{self.base_url}/refresh"
        payload = {"refresh_token": self.refresh_token}

        try:
            response = self.session.post(url, json=payload)
            response.raise_for_status()

            tokens = response.json()
            new_access_token = tokens.get('access_token')

            if not new_access_token:
                raise Exception("Failed to refresh access token")

            # Update session with new access token
            self.access_token = new_access_token
            self.session.headers.update({'Authorization': f'Bearer {self.access_token}'})
            self.logger.info("Access token refreshed successfully.")
            return True
        except requests.exceptions.RequestException as e:
            self.logger.error(f"Token refresh failed: {e}")
            return False


    def request_with_retries(self, method, endpoint, params=None, json=None):
        """
        Make an API request with automatic token refresh if needed.
        Retries once if access token is expired.
        """
        url = f"{self.base_url}/{endpoint}/"

        try:
            response = self.session.request(method, url, params=params, json=json)
            
            # If access token is expired, try refreshing it once
            if response.status_code == 401:
                self.logger.warning("Access token expired. Attempting to refresh...")

                if self.refresh_access_token():
                    response = self.session.request(method, url, params=params, json=json)
                else:
                    self.logger.error("Token refresh failed. Please log in again.")
                    return None

            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            self.logger.error(f"Error in {method.upper()} request to {endpoint}: {e}")
            return None
        
    def get_data(self, endpoint, params=None):
        """Fetch data from the API with token refresh support."""
        return self.request_with_retries("GET", endpoint, params=params)

    def post_data(self, endpoint, payload):
        """Send data to the API with token refresh support."""
        return self.request_with_retries("POST", endpoint, json=payload)

    def put_data(self, endpoint, payload):
        """Send data to the API with token refresh support."""
        return self.request_with_retries("PUT", endpoint, json=payload)
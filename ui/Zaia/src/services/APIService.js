import EncryptedStorage from 'react-native-encrypted-storage';
import RNFS from 'react-native-fs';
import Config from 'react-native-config';
import base64 from 'react-native-base64';
//const apiUrl = Config.API_URL_CLOUD;
const apiUrl = Config.API_URL;


const getStoredTokens = async () => {
    try {
        const tokenData = await EncryptedStorage.getItem("auth_tokens");
        return tokenData ? JSON.parse(tokenData) : null;
    } catch (error) {
        console.error("Error retrieving tokens:", error);
        return null;
    }
};

  const storeTokens = async (accessToken, refreshToken) => {
      try {
          await EncryptedStorage.setItem(
              "auth_tokens",
              JSON.stringify({ access_token: accessToken, refresh_token: refreshToken })
          );
      } catch (error) {
          console.error("Failed to store tokens:", error);
      }
  };

const refreshAccessToken = async () => {
    try {
        const tokens = await getStoredTokens();
        if (!tokens || !tokens.refresh_token) {
            throw new Error("No refresh token available");
        }

        const response = await fetch(`${apiUrl}/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: tokens.refresh_token }),
        });

        if (!response.ok) {
            throw new Error("Failed to refresh token");
        }

        const data = await response.json();
        await storeTokens(data.access_token, tokens.refresh_token);
        return data.access_token;
    } catch (error) {
        console.error("Token refresh failed:", error);
        return null;
    }
};

const fetchWithAuth = async (endpoint, options = {}) => {
    try {
        let tokens = await getStoredTokens();
        if (!tokens || !tokens.access_token) {
            throw new Error("User is not authenticated");
        }

        options.headers = {
            ...options.headers,
            Authorization: `Bearer ${tokens.access_token}`,
        };

        let response = await fetch(`${apiUrl}/${endpoint}`, options);

        if (response.status === 401) { // Token expired
            console.log("Access token expired, refreshing...");
            const newToken = await refreshAccessToken();
            if (!newToken) throw new Error("Failed to refresh token");

            options.headers.Authorization = `Bearer ${newToken}`;
            response = await fetch(`${apiUrl}/${endpoint}`, options);
        }

//        if (!response.ok) {
//            throw new Error(`Request failed: ${response.status}`);
//        }

        return response;
    } catch (error) {
        console.error("API request error:", error);
        throw error;
    }
};

const loginUser = async (username, password) => {
    try {
        const formBody = new URLSearchParams();
        formBody.append("username", username);
        formBody.append("password", password);

        const response = await fetch(`${apiUrl}/token`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" }, // Correct content type
            body: formBody.toString(),
        });


        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        await storeTokens(data.access_token, data.refresh_token);
        return data;
    } catch (error) {
        console.error("Login failed:", error);
        return null;
    }
};

const createUser = async (username, password, code) => {
    try {
        console.log({ username, password, code })
        const response = await fetch(`${apiUrl}/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" }, // Correct content type
            body: JSON.stringify({ username, password, code })
        });


        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        await storeTokens(data.access_token, data.refresh_token);
        return data;
    } catch (error) {
        console.error("Create failed:", error);
        return null;
    }
};

const update_password = async (username, password, code) => {
    try {
        console.log({ username, password, code })
        const response = await fetch(`${apiUrl}/update_password`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" }, // Correct content type
            body: JSON.stringify({ username, password, code })
        });


        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        await storeTokens(data.access_token, data.refresh_token);
        return data;
    } catch (error) {
        console.error("Create failed:", error);
        return null;
    }
};

const logoutUser = async () => {
    try {
        await EncryptedStorage.removeItem("auth_tokens");

        console.log("User logged out");
    } catch (error) {
        console.error("Logout failed:", error);
    }
};


const fetchTopics = async (username) => {
    try {
        const response = await fetchWithAuth(`topics/?user=${username}`);
         if (response.status === 200) {
            return await response.json();
         } else {
            return [];
         }
    } catch (error) {
        console.error("Failed to fetch topics:", error);
        return [];
    }
};

const saveComment = async (id, updatedComments) => {
    try {
        const response = await fetchWithAuth(`update_comment/`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                id: id,
                comments: updatedComments,
            }),
        });

        if (response.status === 200) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        return false;
        console.error(error);
    }
};

const update_journal_item = async (id, updatedText) => {
    try {
        const response = await fetchWithAuth(`update_journal_item/`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                id: id,
                updated_text: updatedText,
            }),
        });

        if (response.status === 200) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        return false;
        console.error(error);
    }
};
const update_marked = async (id, marked) => {
  try {
    const response = await fetchWithAuth(`mark_for_reading/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: id, is_marked: marked }),
    });
    if (response.status === 200) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
    console.error(error);
  }
};

const update_done = async (id) => {
      try
      {
        const response = await fetchWithAuth(`update_done/`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: id,
            is_done: true,
          }),
        });

        if (response.status === 200) {
          return true;
        } else {
          return false;
        }
      } catch (error) {
        return false;
        console.error(error);
      }
  };
const deleteItem = async (id) => {
    try {
      const response = await fetchWithAuth(`delete_item/?id=${id}`, {
        method: "PUT",
      });
      if (response.status === 200) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
      console.error(error);
    }
  };


const deleteMultiItem = async (id) => {
    try {
      const response = await fetchWithAuth(`delete_multi_item/?id=${id}`, {
        method: "PUT",
      });
      if (response.status === 200) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
      console.error(error);
    }
  };

const deleteTopic = async (id) => {
    try {
      const response = await fetchWithAuth(`delete_topic/?id=${id}`, {
        method: "PUT",
      });
      if (response.status === 200) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
      console.error(error);
    }
  };

const deleteJournalItem= async (id) => {
    try {
      const response = await fetchWithAuth(`delete_journal_item/?id=${id}`, {
        method: "PUT",
      });
      if (response.status === 200) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
      console.error(error);
    }
  };
const download_mp3 = async (audio_name) => {
    try {
        console.log('download_mp3 1')
        const localFilePath = `${RNFS.DocumentDirectoryPath}/${audio_name}`;
        const fileExists = await RNFS.exists(localFilePath);
        if (!fileExists) {
        console.log('download_mp3 2')
            // Fetch file using fetchWithAuth
            const response = await fetchWithAuth(`download_mp3/${audio_name}`, {
                method: "GET",
            });
            console.log('download_mp3 3')
            if (!response.ok) {
                throw new Error(`Failed to download file: ${response.status}`);
                return null;
            }
            console.log('download_mp3 4')
            const arrayBuffer = await response.arrayBuffer();
            const buffer = new Uint8Array(arrayBuffer);
            let binaryString = '';
                        for (let i = 0; i < buffer.length; i++) {
                            binaryString += String.fromCharCode(buffer[i]);
                        }
            console.log('download_mp3 5')
            // Save file using RNFS
            const base64Data = base64.encode(binaryString);
            await RNFS.writeFile(localFilePath, base64Data, 'base64');
        }
        return localFilePath;
    } catch (error) {
        console.error("Download error:", error);
        return null;
    }
};
const update_topic = async (payload) => {
    try {
      const response = await fetchWithAuth(`update_topic/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (response.status === 200) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
      console.error(error);
    }
  };

 const insert_topic = async (payload) => {
     try {
       const response = await fetchWithAuth(`insert_topic/`, {
         method: "POST",
          headers: { "Content-Type": "application/json" },
         body: JSON.stringify(payload)
       });
       const responseBody = await response.json();
       console.log('Response:', responseBody);
       if (response.status === 200) {
         return true;
       } else {
         return false;
       }
     } catch (error) {
       return false;
       console.error(error);
     }
   };

const fetchItems = async (topicId, search_term, for_reading, only_with_comments, username) => {
    try {
        const params = new URLSearchParams();

        if (topicId) params.append("topic_id", topicId);
        if (for_reading) params.append("is_marked", for_reading);
        if (only_with_comments) params.append("only_with_comments", only_with_comments);
        if (search_term) params.append("search_term", search_term);

        params.append("user", username);

        const baseUrl = Number.isInteger(topicId) ? "items_old" : "items";
        const url = `${baseUrl}/?${params.toString()}`;

        const response = await fetchWithAuth(url, { method: "GET" });

        if (response.status === 200) {
            const data = await response.json();
            return data;
        } else {
            return [];
        }
    } catch (error) {
        console.error(error);
        return [];
    }
};


 const fetchMultiItem = async (topicId, search_term, username) => {
    try {
      const params = new URLSearchParams();
      if (topicId) params.append('topic_id', topicId);
      if (search_term) params.append('search_term', search_term);
      params.append('user', username);
      const url = `multi_items/?${params.toString()}`;
      const response = await fetchWithAuth(url, {method: "GET"});
      if (response.status === 200) {
          const data = response.json();
          return data;
      }
      else {
          return [];
      }
    } catch (error) {
       return [];
       console.error(error);
    }
 };

  const fetchJournalItems = async (username) => {
     try {
       const params = new URLSearchParams();
       params.append('user', username);
       const url = `journals/?${params.toString()}`;
       const response = await fetchWithAuth(url, {method: "GET"});
       if (response.status === 200) {
           const data = response.json();
           return data;
       }
       else {
           return [];
       }
     } catch (error) {
        return [];
        console.error(error);
     }
  };
 const deleteAudioFile = async (filePath) => {
     try {
       await RNFS.unlink(filePath);
       console.log('Audio file deleted:', filePath);
     } catch (error) {
       console.error('File deletion error:', error);
     }
   };

  const upload_audio = async (filePath, username) => {
    try {
      const formData = new FormData();
      formData.append('audio', {
        uri: 'file://' + filePath,
        name: 'recorded_audio.mp4',
        type: 'audio/mp4',
      });
      formData.append('user', username);
      const response = await fetchWithAuth('upload_audio/', {
        method: 'PUT',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (response.status === 200) {
        const result = await response.json();
        console.log(result)
        await deleteAudioFile(filePath);
        return result;
      } else {
        return {"id":"", "transcript": ""};
      }
    } catch (error) {
      console.error('Upload error:', error);
      return "";
    }
  };

// Export functions to use in other files
export {
    loginUser,
    logoutUser,
    fetchTopics,
    fetchWithAuth,
    fetchJournalItems,
    saveComment,
    update_marked,
    update_done,
    deleteItem,
    deleteMultiItem,
    deleteTopic,
    download_mp3,
    update_topic,
    insert_topic,
    fetchItems,
    fetchMultiItem,
    createUser,
    update_password,
    upload_audio,
    deleteAudioFile,
    deleteJournalItem,
    update_journal_item

};

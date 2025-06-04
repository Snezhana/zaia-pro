import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Button, TextInput, ActivityIndicator,Linking, TouchableOpacity, Alert } from 'react-native';
import Sound from 'react-native-sound';
import Slider from '@react-native-community/slider';
import {common, colors} from "../styles"
import { saveComment, update_marked, update_done,  deleteItem, download_mp3} from '../services/APIService';


const RowItem = ({ item, highlight, onViewDetails, toggleMark, toggleDone, onSoundPlay, indexOfRow, itemWasDeleted }) => {
  const [note, setNote] = useState('');
  const [sound, setSound] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const intervalRef = useRef(null);

  useEffect(() => {
    if (sound) {
      const trackProgress = () => {
          sound.getCurrentTime((seconds) => setCurrentPosition(seconds));
        }
      intervalRef.current = setInterval(trackProgress, 1000);
      return () => clearInterval(intervalRef.current);
    }
  }, [sound]);

  const saveCommentWasPressed = async () => {
    try {
      const updatedComments = [...item.comments, { text: note, date: Date.now()/1000 }];
      const id = item.audio_name.split(".")[0];
      const success = await saveComment(id, updatedComments)

      if (success) {
        Alert.alert(`Comment saved`);
        setNote(""); // Clear the input field
      } else {
        Alert.alert("Failed to save comment.");
      }
    } catch (error) {
      Alert.alert("Failed to save comment..");
      console.error(error);
    }
  };

  const mark_unmark = async () => {
      const id = item.audio_name.split(".")[0];
      const marked = item.hasOwnProperty('is_marked') ? item.is_marked : false;

      try {
        const success = await update_marked(id, !marked)
        if (success) {
          toggleMark(item._id.toString())
          Alert.alert("Marked for reading.");
        } else {
          Alert.alert("Failed to mark for reading.");
        }
      } catch (error) {
        Alert.alert("Failed to mark for reading.");
        console.error(error);
      }
    };


  const saveFinished = async () => {
      const id = item.audio_name.split(".")[0];
      try {
        const success = await update_done(id);
        if (success) {
          toggleDone(item._id.toString())
        } else {
          Alert.alert("Failed to save done.");
        }
      } catch (error) {
        Alert.alert("Failed to save done 1.");
        console.error(error);
      }
    };
  const deleteRow = async () => {
    try {
        const id = item.audio_name.split(".")[0];
        const success = await deleteItem(id);
        if (success) {
            setTimeout(() => itemWasDeleted(indexOfRow), 500);
          } else {
            Alert.alert("Failed to delete.");
          }
        } catch (error) {
          Alert.alert("Failed to delete");
          console.error(error);
        }
      };

  const confirmDelete = () => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this item?',
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Deletion cancelled'),
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: () => deleteRow(),
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };
  const playSound = async () => {
    if (sound) {
        resumePlayback();
        return;
    }
    console.log('Start download')
    setIsLoading(true);
    setError(null);
    const localFilePath = await download_mp3(item.audio_name);
    console.log('Finish download')
    console.log(localFilePath)
    if (localFilePath) {
        console.log('Will start sound')
        const sound = new Sound(localFilePath, '', (error) => {
            if (error) {
              setIsLoading(false);
              console.log(`Error loading ${item.audio_name}:`, error);

              setError('Error playing sound');
              sound.release();

              return;
            }
            setIsLoading(false);
            setSound(sound);
            setDuration(sound.getDuration());
            setIsPlaying(true);

            sound.play((success) => {
              if (!success) {
                console.log(`Playback failed for ${item.audio_name}`);
                setError('Error playing sound');
              }
              sound.release();
              saveFinished();
            });
        });
        }
      else {
        setIsLoading(false);
        sound.release();
        setError('Error downloading audio');
      }
  };

  const pauseSound = () => {
      if (sound) {
        sound.pause(); // Pauses the audio
        setIsPlaying(false);
      }
    };

  const closeAudio = () => {
        if (sound) {
          sound.pause();
          sound.release();// Pauses the audio
        setIsPlaying(false);
        setSound(null)
        setCurrentPosition(0)
        setDuration(0)
        }
      };
  const resumePlayback = () => {
      if (sound) {
        sound.play((success) => {
          if (!success) {
            console.log('Playback failed');
          }
        });
        setIsPlaying(true);
      }
    };
  const handleSliderChange = (value) => {
    if (sound) {
      sound.setCurrentTime(value); // Set the current time of the audio to the slider's value
      setCurrentPosition(value); // Update the position in state
    }
  };


const done = item.hasOwnProperty('done') ? item.done : false;
const containerStyle = [
    { backgroundColor: colors.background },
    common.rowsContainer,
    done && { backgroundColor: colors.white_green }, // Green for done
    highlight && { backgroundColor: colors.white_blue }, // Light blue for currently playing
  ];

const commentsString = item.comments.map(comment => {
    const readableDate = new Date(comment.date * 1000).toLocaleString(); // Convert Unix time to readable datetime
    return `${readableDate}: ${comment.text}`;
    }).join('\n'); // Join with newline or your preferred separator
  return (
             <View style={containerStyle}>
               <Text style={common.titleName}>{item.title}</Text>
                <Text style={common.subtitleName}>{Intl.DateTimeFormat("en-US", {
                                                             year: "numeric",
                                                             month: "numeric",
                                                             day: "numeric",
                                                             hour: "2-digit",
                                                             minute: "2-digit",

                                                           }).format(new Date(item.created_on * 1000))}</Text>
               <View style={common.commentRow}>
                 <TextInput
                   placeholder="Add a note"
                   value={note}
                   onChangeText={setNote}
                   style={common.input}
                 />
                 <TouchableOpacity style={common.saveCommentButton} onPress={saveCommentWasPressed}>
                           <Text style={common.rowButtonText}>Save Note</Text>
                 </TouchableOpacity>
               </View>

               <View style={common.buttonRow}>
                 <TouchableOpacity style={common.row_button} onPress={isPlaying ? pauseSound : playSound}>

                   <Text style={common.rowButtonText}>{isPlaying ? 'Pause' : 'Play'}</Text>

                 </TouchableOpacity>

                 <TouchableOpacity style={common.row_button}
                    onPress={mark_unmark}>
                   <Text style={common.rowButtonText}>{(item.hasOwnProperty('is_marked') ? item.is_marked : false) ? 'Unmark' : 'Mark'}</Text>
                 </TouchableOpacity>

                 <TouchableOpacity style={common.row_button} onPress={() => Linking.openURL(item.source)}>
                   <Text style={common.rowButtonText}>Source</Text>
                 </TouchableOpacity>

                 <TouchableOpacity style={common.row_button} onPress={() => onViewDetails(item )}>
                   <Text style={common.rowButtonText}>Summary</Text>
                 </TouchableOpacity>
                 <TouchableOpacity style={common.delete_button}
                               onPress={() => confirmDelete()}>
                               <Text style={common.buttonText}>Delete</Text>
                           </TouchableOpacity>
               </View>
                {commentsString && <View>
                <Text style={common.smallText}>Previous comments:</Text>
                      <Text style={common.smallText}>{commentsString}</Text>
                      </View>}
               {isLoading && <ActivityIndicator size="large" style={common.loader} />}
               {error && <Text style={common.errorText}>{error}</Text>}

               {sound  && (
                                           <View style={common.audioControls}>
                                             <Slider
                                               style={common.slider}
                                               minimumValue={0}
                                               maximumValue={duration}
                                               value={currentPosition}
                                               onSlidingComplete={handleSliderChange}
                                             />
                                             <Text style={common.smallText}>{`${Math.floor(currentPosition)} / ${Math.floor(duration)} seconds`}</Text>
                                             <TouchableOpacity style={common.row_button} onPress={() => closeAudio()}>
                                                                <Text style={common.rowButtonText}>Close audio</Text>
                                                              </TouchableOpacity>
                                           </View>
                                         )}
             </View>
           );
};


export default RowItem;

import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Alert, Text, ImageBackground, TextInput } from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import RNFS from 'react-native-fs';
import { upload_audio, deleteAudioFile, update_journal_item, deleteJournalItem } from '../services/APIService';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { Platform } from 'react-native';
import {common} from "../styles";
import { useUser } from '../context/UserContext';
import { useNavigation } from '@react-navigation/native';

const audioRecorderPlayer = new AudioRecorderPlayer();

const TrackingScreen = () => {
  const [recording, setRecording] = useState(false);
  const [audioPath, setAudioPath] = useState('');
  const [transcriptText, setTranscriptText] = useState('');
  const [editing, setEditing] = useState(false);
  const [transcriptId, setTranscriptId] = useState('');
  const { username } = useUser();
  const navigation = useNavigation();

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      const result = await request(PERMISSIONS.ANDROID.RECORD_AUDIO);
      if (result !== RESULTS.GRANTED) {
        Alert.alert('Permission Required', 'Microphone access is needed for recording.');
        return false;
      }
    }
    return true;
  };
  const startRecording = async () => {
    const permissionGranted = await requestPermissions()
    if (permissionGranted) {
        try {
          const path = `${RNFS.TemporaryDirectoryPath}/temp.mp4`;
          setAudioPath(path);
          const uri = await audioRecorderPlayer.startRecorder(path);
          setRecording(true);
          console.log('Recording started:', uri);
        } catch (error) {
          console.error('Start recording error:', error);
        }
    }
  };

  const stopRecording = async () => {
    try {
      const result = await audioRecorderPlayer.stopRecorder();
      setRecording(false);
      console.log('Recording stopped:', result);
      const response = await upload_audio(audioPath, username);
      console.log('Response:', response);
      setTranscriptText(response.transcript)
      setTranscriptId(response.id)
    } catch (error) {
      console.error('Stop recording error:', error);
    }
  };
  const cancelRecording = async () => {
    try {
      const result = await audioRecorderPlayer.stopRecorder();
      setRecording(false);
      console.log('Recording cancelled:', result);
      deleteAudioFile(audioPath)
    } catch (error) {
      console.error('Stop recording error:', error);
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

  const goToHistory = () => {
    navigation.navigate('JournalHistory'); // No topic data for adding
  };

  const startEditing = (item) => {
      setEditing(true);
    };

  const cancelEditing = () => {
      setEditing(false);
    };

  const saveEdit = async () => {
      if (transcriptId == '') {
            return
        }
          try {
            const success = await update_journal_item(transcriptId, transcriptText);
            if (success) {
              setEditing(false);
            } else {
              alert('Failed to update item.');
            }
          } catch (error) {
            alert('Error updating item');
            console.error(error);
          }
    };
  const deleteTopicWasPressed = async () => {
      if (transcriptId == '') {
              return
          }
      try {
        const success = await deleteJournalItem(transcriptId);
        if (success) {
          setTranscriptText('')
          setTranscriptId('')
          setEditing(false)
        } else {
          alert('Failed to delete.');
        }
      } catch (error) {
        alert('Failed to delete');
        console.error(error);
      }
    };

    const confirmDelete = () => {
    if (transcriptId == '') {
                return
            }
      Alert.alert(
        'Confirm Deletion',
        'Are you sure you want to delete the journal item?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', onPress: () => deleteTopicWasPressed(), style: 'destructive' },
        ],
        { cancelable: true }
      );
    };
  return (
  <ImageBackground
        source={require('../../assets/background.webp')}//
        style={common.background}
        resizeMode="cover" // Ensures the image covers the entire screen
      >
      <View style={common.commentRow}>
            <TouchableOpacity style={common.big_button} onPress={goToHistory}>
              <Text style={common.buttonText}>History</Text>
            </TouchableOpacity>
            <TouchableOpacity style={common.big_button} onPress={stopRecording} >
              <Text style={common.buttonText}>Insights</Text>
            </TouchableOpacity>
      </View>
    <View style={common.container_user}>
      <TouchableOpacity style={[common.big_button, recording && { opacity: 0.5 }]} onPress={startRecording} disabled={recording}>
        <Text style={common.buttonText}>Start Recording</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[common.big_button, !recording && { opacity: 0.5 }]} onPress={stopRecording} disabled={!recording}>
        <Text style={common.buttonText}>Stop Recording</Text>
      </TouchableOpacity>
        <TouchableOpacity style={[common.big_button, !recording && { opacity: 0.5 }]} onPress={cancelRecording} disabled={!recording}>
          <Text style={common.buttonText}>Cancel Recording</Text>
        </TouchableOpacity>
    {!editing ? (<Text style={common.titleName}>{transcriptText}</Text>): (
    <>
        <TextInput
            style={common.input}
            value={transcriptText}
            onChangeText={setTranscriptText}
          />
            <View style={common.buttonContainer}>
             <TouchableOpacity style={common.row_button} onPress={() => saveEdit()}>
               <Text style={common.buttonText}>Save</Text>
             </TouchableOpacity>
             <TouchableOpacity style={common.delete_button} onPress={cancelEditing}>
               <Text style={common.buttonText}>Cancel</Text>
             </TouchableOpacity>
             </View>
           </>)}

   {transcriptText!='' && !editing  && (
   <View style={common.buttonContainer}>
       <TouchableOpacity style={common.row_button} onPress={startEditing}>
         <Text style={common.buttonText}>Edit</Text>
       </TouchableOpacity>
       <TouchableOpacity style={common.delete_button} onPress={() => confirmDelete()}>
         <Text style={common.buttonText}>Delete</Text>
       </TouchableOpacity>
   </View>)}
    </View>
    </ImageBackground>
  );
};

export default TrackingScreen;

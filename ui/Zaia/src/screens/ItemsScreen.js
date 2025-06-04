import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  SafeAreaView,
  FlatList,
  View,
  Text,
  ActivityIndicator,
  TextInput,
  Button,
  TouchableOpacity,
  ImageBackground,
  Alert
} from 'react-native';
import Slider from '@react-native-community/slider';
import Sound from 'react-native-sound';
import RowItem from '../components/RowItem';
import Config from 'react-native-config';
import {common, colors} from "../styles"
import { useFocusEffect } from '@react-navigation/native';
import RNFS from 'react-native-fs';
import { useUser } from '../context/UserContext';
import { fetchItems, update_done, download_mp3 } from '../services/APIService';


const ItemsScreen = ({ route, navigation }) => {

  const { topicId, for_reading, topic_name, only_with_comments } = route.params || {};
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState(null);
  const [currentSound, setCurrentSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playAllDisabled, setPlayAllDisabled] = useState(false);
  const [rowsCurrentSound, setRowsCurrentSound] = useState(null);
  const [soundLoading, setSoundLoading] = useState(false);
  const { username } = useUser();
  const intervalRef = useRef(null);


  useEffect(() => {
        fetchData(topicId, searchTerm, for_reading, only_with_comments);
      }, []);

  useEffect(() => {
    if (currentSound) {
      const trackProgress = () => {
        currentSound.getCurrentTime((seconds) => setCurrentPosition(seconds));
      };
      intervalRef.current = setInterval(trackProgress, 1000);

      return () => clearInterval(intervalRef.current);
    }
  }, [currentSound, playAllDisabled]);

  useEffect(() => {
       const unsubscribe = navigation.addListener('beforeRemove', () => {
         if (currentSound) {
           currentSound.stop(() => {
             currentSound.release();
           });
         }
         if (rowsCurrentSound) {
              rowsCurrentSound.release();
         }


       // Cleanup listener when component unmounts
       return unsubscribe;
       })
     }, [navigation, currentSound, rowsCurrentSound]);

    const fetchData = async (topicId, search_term, for_reading, only_with_comments) => {
        setLoading(true);
        setError(null);
        const data = await fetchItems(topicId, search_term, for_reading, only_with_comments, username);
        if (data.length > 0) {
            setData(data);
          }
        else {
            Alert.alert('There is no items or there was a problem loading items')
        }
        setLoading(false);
  };

  const handleSearch = () => {
  if (currentSound)  {
    closeAudio()
  }
  if (rowsCurrentSound) {
    rowsCurrentSound.release()
  }
    fetchData(topicId, searchTerm, for_reading, only_with_comments);
  };

  const saveFinished = async (id) => {
      try {
        const success = await update_done(id);
        if (success) {
            setData((prevData) =>
            prevData.map((item) =>
          item.audio_name.split(".")[0] == id ? { ...item, done: true } : item
        )

      );
        console.log(`Marked item with id "${id}" as done.`);
        } else {
          Alert.alert("Failed to save done.");
        }
      } catch (error) {
        alert("Failed to save done 1.");
        Alert.console.error(error);
      }
    };

  const playSound = async (index) => {
    console.log(`Attempting to play sound at index: ${index}`);
    if (index >= data.length) return;
    console.log('if (index >= data.length) return;');
    if (data[index].done) {
        console.log('(data[index].done)');
        playSound(index + 1)
        return;
    }
    setPlayAllDisabled(true)
    setSoundLoading(true)


      const localFilePath = await download_mp3(data[index].audio_name);
      console.log(localFilePath);
      if (!localFilePath) {
        console.log(`Failed to download ${data[index].audio_name}:`, error);
        setSoundLoading(false)
        playSound(index + 1);
        setPlayAllDisabled(false)
        return;
        }

    setSoundLoading(false)
    const sound = new Sound(localFilePath, '', (error) => {
        if (error) {
          console.log(`Error loading ${data[index].audio_name}:`, error);
          sound.release();
          playSound(index + 1);
          setPlayAllDisabled(false)
          return;
        }

        setCurrentSound(sound);
        setDuration(sound.getDuration());
        setIsPlaying(true);
        setCurrentIndex(index);
        setSoundLoading(false)
        sound.play((success) => {
          if (!success) {
            console.log(`Playback failed for ${data[index].audio_name}`);
          }
          sound.release();
          saveFinished(data[index].audio_name.split(".")[0]);
          playSound(index + 1);
        });
    });
  };

  const playAll = () => {
    if (currentSound) {
      currentSound.stop(() => playSound(0));
    } else {
      playSound(0);
    }
  };

  const playNext = () => {
    if (currentSound) {
       saveFinished(data[currentIndex].audio_name.split(".")[0]);
       currentSound.stop(() => playSound(currentIndex+1));
    }
  };

  const pausePlayback = () => {
    if (currentSound) {
      currentSound.pause(); // Pauses the audio
      setIsPlaying(false);
    }
  };

  const resumePlayback = () => {
    if (currentSound) {
      currentSound.play((success) => {
        if (!success) {
          console.log('Playback failed');
        }
      });
      setIsPlaying(true);
    }
  };

  const closeAudio = () => {
      if (currentSound) {
        currentSound.pause(); // Pauses the audio
        currentSound.release();
      setIsPlaying(false);
      setCurrentSound(null)
      setCurrentPosition(0)
      setDuration(0)
      setPlayAllDisabled(false)

      }
        };

  const handleSliderChange = (value) => {
    if (currentSound) {
      currentSound.setCurrentTime(value);
      setCurrentPosition(value);
    }
  };
 const handleViewDetails = (item) => {

    navigation.navigate('ItemDetails', { item });
  };

 const toggleMark = (id) => {
    setData((prevTopics) =>
      prevTopics.map((item) =>
        item._id.toString() === id ? { ...item, is_marked: !item.is_marked } : item
      )
    );

  };
 const rowItemWasDeleted = (index) => {
    if (index >= currentIndex)
      closeAudio();
      fetchData(topicId, searchTerm, for_reading, only_with_comments);
    };

 const toggleDone = (id) => {
    setData((prevTopics) =>
      prevTopics.map((item) =>
        item._id.toString() === id ? { ...item, done: !item.done } : item
      )
    );
  };
  if (loading) {
    return (
      <SafeAreaView style={common.centered}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={common.centered}>
        <Text>Error: {error.message}</Text>
      </SafeAreaView>
    );
  }

  return (
  <ImageBackground
        source={require('../../assets/background.webp')}//
        style={common.background}
        resizeMode="cover" // Ensures the image covers the entire screen
      >
    <SafeAreaView style={common.items_container}>
    <View style={common.headerTopicName}>
        <Text style={common.topicTitleInHeader}> {topic_name}</Text>
    </View>
      <View style={common.search_header}>
        <TextInput
          placeholder="Search items..."
          placeholderTextColor = {colors.placeholderTextColor}
          style={common.input}
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        <TouchableOpacity style={common.middle_button} onPress={handleSearch}>
          <Text style={common.buttonText}>Search</Text>
        </TouchableOpacity>
        <TouchableOpacity
            style={[common.middle_button, playAllDisabled && { opacity: 0.5 }]}
            onPress={playAll}
             disabled={(playAllDisabled)}>
          <Text style={common.buttonText}>Play All</Text>
        </TouchableOpacity>

      </View>
      {soundLoading && (<View style={common.header}>
                            <ActivityIndicator size="large" />
                        </View>)}
      {currentSound && (
        <View style={common.audioControls}>
          <Text style = {common.subtitleName}>
            Playing: {data[currentIndex]?.title || 'Unknown'} ({currentIndex + 1}/{data.length})
          </Text>
          <Slider
            style={common.slider}
            minimumValue={0}
            maximumValue={duration}
            value={currentPosition}
            onSlidingComplete={handleSliderChange}
          />
          <Text style = {common.subtitleName}>
            {Math.floor(currentPosition)}s / {Math.floor(duration)}s
          </Text>
          <View style={common.buttonContainer}>
            {isPlaying ? (
                    <TouchableOpacity style={common.row_button} onPress={pausePlayback}>
                      <Text style={common.buttonText}>Pause</Text>
                    </TouchableOpacity>
            ) : (
                    <TouchableOpacity style={common.row_button} onPress={resumePlayback}>
                      <Text style={common.buttonText}>Resume</Text>
                    </TouchableOpacity>

            )}
            <TouchableOpacity style={common.row_button} onPress={closeAudio}>
              <Text style={common.buttonText}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity style={common.row_button} onPress={playNext}>
              <Text style={common.buttonText}>Next >> </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <FlatList
        data={data}
        keyExtractor={(item) => item._id.toString()}
        renderItem={({ item, index }) => {


          return (
            <RowItem
              item={item}
              highlight={index === currentIndex && isPlaying}
              onViewDetails={handleViewDetails}
              toggleMark={() => toggleMark(item._id.toString())}
              toggleDone={() => toggleDone(item._id.toString())}
              onSoundPlay = {(soundInstance) => {setRowsCurrentSound(soundInstance);}}
              indexOfRow={index}
              itemWasDeleted={() => {rowItemWasDeleted(index)}}
            />
          );
        }}
      />
    </SafeAreaView>
    </ImageBackground>
  );
};


export default ItemsScreen;

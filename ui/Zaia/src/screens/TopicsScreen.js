import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Button, TouchableOpacity , SafeAreaView, Alert, ImageBackground } from 'react-native';
import Config from 'react-native-config';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../context/UserContext';
import { common, colors } from "../styles";
import { fetchTopics, deleteTopic } from '../services/APIService';

const Topics = ({ onTopicSelect })  => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigation = useNavigation();
  const { username } = useUser();
  const loadTopics = async () => {
    console.log('loadTopics')
    if (username=='') {
        setError('You must have a user to create a topic. \n Go in User Screen and write your name')
        setLoading(false)
        return
    }
    try {
      const data = await fetchTopics(username);
      if (data.length ==0) {
        setError('Add a Topic to start'); }
      else {
        setError(null)
        setTopics(data);}

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

    useEffect(() => {
      const unsubscribe = navigation.addListener('focus', loadTopics);
      return unsubscribe;
    }, [navigation]);

  const addTopic = () => {
    navigation.navigate('AddEditTopic'); // No topic data for adding
  };


const deleteTopicWasPressed = async (topic_id) => {
        try {
          const success = await deleteTopic(topic_id);
          if (success) {
            loadTopics();
          } else {
            alert("Failed to delete.");
          }
        } catch (error) {
          alert("Failed to delete");
          console.error(error);
        }
      };

  const confirmDelete = (topic_id) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this topic?',
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Deletion cancelled'),
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: () => deleteTopicWasPressed(topic_id),
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };

  const renderItem = ({ item }) => (
    <View style={common.rowsContainer}>
    {item.is_multi_item &&
    (
        <Text style={common.topicName}>{item.topic_name} ({item.total_multi_items})</Text>
    )}
    {!item.is_multi_item &&
        (
      <Text style={common.topicName}>{item.topic_name} ({item.done_items}/{item.total_items})</Text>
      )}
      <Text style={common.subtitleName}>{Intl.DateTimeFormat("en-US", {
                                             year: "numeric",
                                             month: "numeric",
                                             day: "numeric",
                                             hour: "2-digit",
                                             minute: "2-digit",

                                           }).format(new Date(item.created_on * 1000))}</Text>

      <View style={common.buttonContainer}>
        <Text style={common.subtitleName}>{item.topic_type}</Text>
        {item.topic_type == 'news'  && (<Text style={common.subtitleName}>{item.frequency}</Text>)}
      </View>
      {item.items && item.items.map((subItem, index) => (
        <View key={index} style={common.insideRowContainer}>
          <Text style={common.subtitleName}>• {subItem.item_name}</Text>
        </View>
      ))}
      <View style={common.buttonContainer}>
          <TouchableOpacity style={common.row_button}
          onPress={(item.is_multi_item) ?  () => navigation.navigate('MultiItems', { topicId: item.id, topic_name: item.topic_name }) :  () => navigation.navigate('Items', { topicId: item.id, topic_name: item.topic_name }) }>
             <Text style={common.buttonText}>View Items</Text>
          </TouchableOpacity>
          <TouchableOpacity style={common.row_button}
              onPress={() => navigation.navigate('AddEditTopic', { topic: item })}>
              <Text style={common.buttonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={common.delete_button}
              onPress={() => confirmDelete(item.id)}>
              <Text style={common.buttonText}>Delete</Text>
          </TouchableOpacity>


            </View>
    </View>
  );

  if (loading) {
    return (
      <View style={common.centered}>
        <ActivityIndicator size="large" color={colors.button_dark_text} />
        <Text>Loading Topics...</Text>
      </View>
    );
  }

  return (
    <ImageBackground
      source={require('../../assets/background.webp')}//
      style={common.background}
      resizeMode="cover" // Ensures the image covers the entire screen
    >
  <SafeAreaView style={common.items_container}>
    {username!='' && (<View style={common.buttonContainer}>
              <TouchableOpacity style={common.big_button} onPress={addTopic}>
                <Text style={common.buttonText}>+ Add Topic</Text>
              </TouchableOpacity>
                  </View>)}
    {error && (<View style={common.container_user}>
                       <Text style={common.errorText}>{error}</Text>
                     </View>)}
    <FlatList
      data={topics}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderItem}
    />

        </SafeAreaView>
        </ImageBackground>
  );
};

export default Topics;

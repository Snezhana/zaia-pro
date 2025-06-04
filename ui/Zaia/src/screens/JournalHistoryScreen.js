import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Button, TouchableOpacity , SafeAreaView, Alert, ImageBackground, TextInput } from 'react-native';
import Config from 'react-native-config';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../context/UserContext';
import { common, colors } from "../styles";
import { fetchJournalItems, deleteJournalItem, update_journal_item } from '../services/APIService';

const JournalHistory = ()  => {
  const [journalItems, setJournalItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editedText, setEditedText] = useState('');
  const navigation = useNavigation();
  const { username } = useUser();

  useEffect(() => {
    loadJournalItems();
  }, []);

  const loadJournalItems = async () => {
    if (username === '') {
      setError('You need to have a user to load the history. \n Go in User Screen and write your name');
      setLoading(false);
      return;
    }
    try {
      console.log('Loading History');
      const data = await fetchJournalItems(username);
      console.log(data);
      if (data.length === 0) {
        setError('No Items in the Journal');
      } else {
        setError(null);
        setJournalItems(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteTopicWasPressed = async (journal_item_id) => {
    try {
      const success = await deleteJournalItem(journal_item_id);
      if (success) {
        loadJournalItems();
      } else {
        alert('Failed to delete.');
      }
    } catch (error) {
      alert('Failed to delete');
      console.error(error);
    }
  };

  const confirmDelete = (journal_item_id) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete the journal item?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', onPress: () => deleteTopicWasPressed(journal_item_id), style: 'destructive' },
      ],
      { cancelable: true }
    );
  };

  const startEditing = (item) => {
    setEditingId(item.id);
    setEditedText(item.transcript);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditedText('');
  };

  const saveEdit = async (item) => {
    try {
      const success = await update_journal_item(item.id, editedText);
      if (success) {
        loadJournalItems();
        setEditingId(null);
      } else {
        alert('Failed to update item.');
      }
    } catch (error) {
      alert('Error updating item');
      console.error(error);
    }
  };

  const renderItem = ({ item }) => (
    <View style={common.rowsContainer}>
      <Text style={common.subtitleName}>{Intl.DateTimeFormat('en-US', {
        year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
      }).format(new Date(item.created_on * 1000))}</Text>

      {editingId === item.id ? (
        <TextInput
          style={common.input}
          value={editedText}
          onChangeText={setEditedText}
        />
      ) : (
        <Text style={common.topicName}>{item.transcript}</Text>
      )}

      <View style={common.buttonContainer}>
        {editingId === item.id ? (
          <>
            <TouchableOpacity style={common.row_button} onPress={() => saveEdit(item)}>
              <Text style={common.buttonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={common.delete_button} onPress={cancelEditing}>
              <Text style={common.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={common.row_button} onPress={() => startEditing(item)}>
            <Text style={common.buttonText}>Edit</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={common.delete_button} onPress={() => confirmDelete(item.id)}>
          <Text style={common.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={common.centered}>
        <ActivityIndicator size="large" color={colors.button_dark_text} />
        <Text>Loading History...</Text>
      </View>
    );
  }

  return (
    <ImageBackground source={require('../../assets/background.webp')} style={common.background} resizeMode="cover">
      <SafeAreaView style={common.items_container}>
        <FlatList data={journalItems} keyExtractor={(item) => item.id.toString()} renderItem={renderItem} />
      </SafeAreaView>
    </ImageBackground>
  );
};

export default JournalHistory;
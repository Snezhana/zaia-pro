import { StyleSheet } from 'react-native';

const colors = {
  orange:'#FFA500' ,//c1
  dark_green:'#288C84',//c2
  button_dark_text:'002244',//c13
  red:'#FF6F61',//c3
  transparent_container:'rgba(223, 240, 236, 0.8)',//c6
  background:'#DFF0EC', //c7
  shadow: '#008B8B',
  turquoise: '#40E0D0',//c4
  input_background: '#F0FFFF',//c8
  white_text: '#DFF0EC',
  green:'#36B8AA',
  white_green: '#BEE8BE',
  white_blue: '#87CEFA'
};

const baseButtonStyle = {
  backgroundColor: colors.orange,
  borderRadius: 8,
  alignItems: 'center',
  margin: 5,
  shadowColor: colors.shadow,
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.6,
  shadowRadius: 2,
  elevation: 3,
};

const baseInput = {
  borderWidth: 1,
  borderColor: colors.turquoise,
  padding: 5,
  marginRight: 10,
  borderRadius: 5,
  backgroundColor: colors.input_background,
  color: '#288C84',
}

const common = StyleSheet.create({
//containers
  background: { //Home, Topics, Items
    flex: 1,
    width: '100%',
    height: '100%',
  },
    container_home: { //Home, user
      flex: 1,
      justifyContent: "center",
      alignItems: "center",

      padding: 20,
    },
    container_user: {
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.transparent_container,
      padding: 20,
      borderRadius: 10,
      width: '80%',
      height: 'auto',
      position: 'absolute',
      top: '40%',
      left: '10%',

    },
  container: { //Home, user
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  centered: { //Topics, Items (loading, error)
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor:colors.dark_green
  },
    rowsContainer: {//Topics, RowItems
        backgroundColor: colors.background,
        padding: 15,
        borderBottomWidth: 1,
        borderColor: colors.turquoise,
        borderRadius: 10,
        margin: 10,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 3,
        elevation: 5,
      },
insideRowContainer: {//Topics
   backgroundColor: colors.input_background,
   padding: 10,
   borderRadius: 8,
   marginTop: 10,
 },
    buttonContainer: {//Topics
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 10
    },
  scrollViewContainer: { // AddTopic
       paddingHorizontal: 16,
    },
 picker: { // AddTopic
   borderWidth: 1,
   borderColor: colors.input_border,
   borderRadius: 4,
   marginTop: 5,
   color: colors.dark_green,
   },
 search_header: { //Items
     flexDirection: 'row',
     alignItems: 'center',
     padding: 10,
     backgroundColor: colors.background,
   },

 audioControls: { //Items
   padding: 10,
   borderBottomWidth: 1,
   borderRadius: 10,
   margin: 10,
   shadowColor: colors.shadow,
   shadowOffset: { width: 0, height: 2 },
   shadowOpacity: 0.8,
   shadowRadius: 3,
   elevation: 5,
   backgroundColor: colors.input_background,
 },
slider: { //Items
    width: '100%',
    height: 40,
  },

commentRow: { // RowItem
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
      },
    buttonRow: { // RowItem
        flexDirection: 'row',
        justifyContent: 'space-between',
      },
      pickerRow: { // RowItem
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 10,

            },
      pickerRowUser: { // RowItem
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 10,
                    backgroundColor: colors.dark_green,
                  },
    loader: { // RowItem
        marginTop: 10,
      },
items_container: { //Items
    flex:1,
//    padding: 8
    },
 //buttons
  big_button: { //Home, user
    ...baseButtonStyle,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  picker_button: { //Home, user
      ...baseButtonStyle,
      paddingVertical: 14,
      paddingHorizontal: 20,
      margin: 0,
    },
     picker_button_selected: { //Home, user
         ...baseButtonStyle,
         paddingVertical: 14,
         paddingHorizontal: 20,
         margin: 0,
         opacity: 0.5,
         borderWidth: 2
       },
  middle_button: { //Items(Search/PlayAll)
    ...baseButtonStyle,
    paddingVertical: 6,
    paddingHorizontal: 12,

  },
  delete_button: { //Topics, RowItem
  ...baseButtonStyle,
    backgroundColor: colors.red,
    padding: 4,
    flex: 1,
    margin: 2,
  },
  row_button: { //Topics, Items, RowItem
    ...baseButtonStyle,
      backgroundColor: colors.dark_green,
      padding: 4,
      flex: 1,
      margin: 2,
    },
  saveCommentButton: { //RowItem
    ...baseButtonStyle,
    backgroundColor: colors.dark_green,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
      },
  buttonText: { //Home, user, AddTopic, items, itemDetails
    color: colors.button_dark_text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  //text
  rowButtonText: { //RowItem
    color: colors.button_dark_text,
    fontWeight: 'bold',
    fontSize: 12,
      },
  errorText: { //Topics
   color: colors.red,
   fontWeight: 'bold',
   fontSize: 16,
//   backgroundColor: colors.dark_green
 },
titleName: {//, User, AddTopic, RowItem
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.dark_green,
    marginBottom: 10,
  },
  topicName: {//Topics
      fontSize: 17,
      fontWeight: 'bold',
      color: colors.dark_green,
      marginBottom: 5,
    },
  topicTitleInHeader: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.white_text,
      marginBottom: 0,
      textAlign: 'center',
    },
detailsText: {//Topics, AddTopic
    fontSize: 14,
    color: colors.green,
    marginTop: 4,
  },
summaryText: { //ItemDetails
         fontSize: 16,
         marginVertical: 4,
         color: colors.green,
       },
  subtitleName: {//Topics, Items
      fontSize: 14,
      fontWeight: '600',
      color: colors.green,
    },

    smallText: {//RowItem
           fontSize: 10,
           marginBottom: 10,
           color: colors.green,
         },
    headerTopicName: { //Items
         flexDirection: 'row',
         alignItems: 'center',
         padding: 10,
         backgroundColor: colors.green,
       },
  //input
  input: {//AddTopic, RowItem
      ...baseInput,
      flex: 1,
    },
  inputUser: { //User
      ...baseInput,
    },
inputAddTopic: { //User
      ...baseInput,
      marginBottom: 10
    },

    //navigation header
  header_text: {//AppNavigation
    fontSize: 32,
        color: 'white',
        textAlign: 'center',
        width: '100%'

},
  headerStyle: { //AppNavigation
    backgroundColor: colors.dark_green
  },

  headerTitleStyle: { //AppNavigation
  fontWeight: 'bold'
  },
  //table styles
    tableContainer: {
      borderWidth: 2,
      borderColor: colors.turquoise,
      borderRadius: 5,
      overflow: 'hidden',
    },
    tableRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: colors.turquoise,
      paddingVertical: 8,
      paddingHorizontal: 10,
    },
    tableCell: {
      paddingVertical: 8,
      paddingHorizontal: 8,
      textAlign: 'left',
      fontSize: 14,
      color: colors.dark_green,
    },
});
export { colors, common };

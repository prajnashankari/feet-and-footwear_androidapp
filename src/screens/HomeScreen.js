import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  Linking,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DropDownPicker from 'react-native-dropdown-picker';
import { ScrollView } from 'react-native';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [footImage, setFootImage] = useState(null);
  const [footSize, setFootSize] = useState('Not measured');
  const [isImagePickerVisible, setIsImagePickerVisible] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [gender, setGender] = useState('male');
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState([
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
  ]);

  const handleShopLink = async (platform) => {
    if (footSize === 'Not measured' || !footSize.includes('cm')) {
      alert('Please upload image and predict foot size first.');
      return;
    }

    setIsLoading(true);
    const size_cm = parseFloat(footSize.replace(' cm', ''));
    try {
      const response = await fetch('http://192.168.154.77:5000/get_url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: platform.toLowerCase(),
          gender,
          foot_size_cm: size_cm
        }),
      });

      const data = await response.json();
      setIsLoading(false);
      if (response.ok && data.url) {
        Linking.openURL(data.url);
      } else {
        alert(data.error || 'Product not found');
      }
    } catch (error) {
      console.error('Error fetching product URL:', error);
      alert('Error fetching product URL.');
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    navigation.navigate('Login');
  };

  const uploadFootImage = async (uri) => {
    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append('image', {
        uri,
        type: 'image/jpeg',
        name: 'foot.jpg',
      });

      const response = await fetch('http://192.168.154.77:5000/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();

        if (response.ok && data.foot_size_cm) {
          setFootSize(`${data.foot_size_cm} cm`);
          setShowRecommendations(true);
        } else {
          console.error('Backend Error:', data);
          setFootSize('Size detection failed');
        }
      } else {
        const text = await response.text();
        console.error('Unexpected response (not JSON):', text);
        setFootSize('Unexpected response from server');
      }
    } catch (error) {
      console.error('Fetch Error:', error);
      setFootSize('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Foot Size Predictor</Text>
        <TouchableOpacity
          style={styles.profileIcon}
          onPress={() => setIsMenuVisible(true)}
        >
          <Ionicons name="person-circle" size={32} color="#007bff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.footSection}>
          <TouchableOpacity
            style={styles.footImageButton}
            onPress={() => setIsImagePickerVisible(true)}
          >
            {footImage ? (
              <View style={styles.imageContainer}>
                <Image source={{ uri: footImage }} style={styles.footImage} />
                <View style={styles.editOverlay}>
                  <Ionicons name="camera" size={20} color="#fff" />
                </View>
              </View>
            ) : (
              <View style={styles.placeholderContainer}>
                <Ionicons name="camera" size={40} color="#007bff" />
                <Text style={styles.placeholderText}>Add Foot Image</Text>
              </View>
            )}
          </TouchableOpacity>

          {footImage && (
            <TouchableOpacity
              style={styles.predictButton}
              onPress={() => uploadFootImage(footImage)}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="analytics" size={20} color="#fff" />
                  <Text style={styles.predictButtonText}>Predict Size</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <View style={styles.footSizeContainer}>
            {footSize !== 'Not measured' && (
              <View style={styles.sizeCard}>
                <Text style={styles.footSizeLabel}>Foot Size:</Text>
                <Text style={styles.footSizeValue}>{footSize}</Text>
              </View>
            )}

            <View style={styles.genderSelector}>
              <Text style={styles.genderLabel}>Select Gender:</Text>
              <DropDownPicker
                open={open}
                value={gender}
                items={items}
                setOpen={setOpen}
                setValue={setGender}
                setItems={setItems}
                containerStyle={{ height: 40 }}
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
                textStyle={styles.dropdownText}
              />
            </View>

            {footSize !== 'Not measured' && showRecommendations && (
              <View style={styles.recommendationsContainer}>
                <View style={styles.recommendHeaderContainer}>
                  <Ionicons name="cart" size={20} color="#007bff" />
                  <Text style={styles.recommendationsTitle}>Shop for shoes at:</Text>
                </View>

                {['Amazon', 'Flipkart', 'Zappos'].map((platform) => (
                  <TouchableOpacity
                    key={platform}
                    style={styles.shopButton}
                    onPress={() => handleShopLink(platform)}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Ionicons name="cart-outline" size={20} color="#fff" />
                        <Text style={styles.shopButtonText}>{platform}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Profile Menu Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isMenuVisible}
        onRequestClose={() => setIsMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsMenuVisible(false)}
        >
          <View style={styles.menuContainer}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuHeaderText}>Profile Options</Text>
            </View>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setIsMenuVisible(false);
                navigation.navigate('Login'); // Navigate to Login instead of Home
              }}
            >
              <Ionicons name="home" size={24} color="#007bff" />
              <Text style={styles.menuText}>Home</Text>
            </TouchableOpacity>


            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setIsMenuVisible(false);
                navigation.navigate('EditProfile');
              }}
            >
              <Ionicons name="create" size={24} color="#007bff" />
              <Text style={styles.menuText}>Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setIsMenuVisible(false);
                handleLogout();
              }}
            >
              <Ionicons name="log-out" size={24} color="#007bff" />
              <Text style={styles.menuText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>


      {/* Image Picker Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isImagePickerVisible}
        onRequestClose={() => setIsImagePickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsImagePickerVisible(false)}
        >
          <View style={styles.imagePickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Image</Text>
              <TouchableOpacity onPress={() => setIsImagePickerVisible(false)}>
                <Ionicons name="close" size={24} color="#007bff" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.imagePickerOption}
              onPress={async () => {
                setIsImagePickerVisible(false);
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') {
                  alert('Camera permission required');
                  return;
                }

                const result = await ImagePicker.launchCameraAsync({ quality: 1 });
                if (!result.canceled) {
                  setFootImage(result.assets[0].uri);
                  setFootSize('Size calculation pending...');
                }
              }}
            >
              <View style={styles.pickerIconCircle}>
                <Ionicons name="camera" size={24} color="#fff" />
              </View>
              <Text style={styles.imagePickerText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.imagePickerOption}
              onPress={async () => {
                setIsImagePickerVisible(false);
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                  alert('Gallery permission required');
                  return;
                }

                const result = await ImagePicker.launchImageLibraryAsync({ quality: 1 });
                if (!result.canceled) {
                  setFootImage(result.assets[0].uri);
                  setFootSize('Size calculation pending...');
                }
              }}
            >
              <View style={styles.pickerIconCircle}>
                <Ionicons name="images" size={24} color="#fff" />
              </View>
              <Text style={styles.imagePickerText}>Choose from Gallery</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  profileIcon: {
    padding: 8,
  },
  footSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10, // Reduced from 20
    paddingBottom: 20,
  },

  footImageButton: {
    width: width * 0.5, // Reduced from 0.7
    height: width * 0.5, // Reduced from 0.7
    borderRadius: 15,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15, // Reduced from 20
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  footImage: {
    width: '100%',
    height: '100%',
  },
  editOverlay: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,123,255,0.8)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  placeholderText: {
    marginTop: 10,
    color: '#007bff',
    fontSize: 16,
  },
  predictButton: {
    backgroundColor: '#007bff',
    flexDirection: 'row',
    paddingVertical: 8, // Reduced from 12
    paddingHorizontal: 16, // Reduced from 20
    borderRadius: 20, // Reduced from 25
    justifyContent: 'center',
    alignItems: 'center',
    width: '70%', // Reduced from 80%
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  // Make the text in the predict button smaller
  predictButtonText: {
    color: '#fff',
    fontSize: 16, // Reduced from 18
    fontWeight: 'bold',
    marginLeft: 8, // Reduced from 10
  },

  // Reduce spacing between sections
  footSizeContainer: {
    alignItems: 'center',
    marginTop: 15, // Reduced from 25
    width: '100%',
  },

  // Make the size card more compact
  sizeCard: {
    backgroundColor: '#fff',
    padding: 12, // Reduced from 16
    borderRadius: 15,
    marginBottom: 15, // Reduced from 20
    width: '100%',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  footSizeLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  footSizeValue: {
    fontSize: 28,
    color: '#007bff',
    fontWeight: 'bold',
  },
  genderSelector: {
    width: '100%',
    marginTop: 10,
    marginBottom: 20,
    padding: 16,
    borderRadius: 15,
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 100,
  },
  genderLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  dropdown: {
    borderColor: '#e0e0e0',
    borderRadius: 8,
  },
  dropdownContainer: {
    borderColor: '#e0e0e0',
    borderRadius: 8,
    elevation: 3,
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  recommendationsContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 15,
    width: '100%',
    marginTop: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  recommendHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  recommendationsTitle: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
    fontWeight: 'bold',
  },
  shopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginVertical: 8,
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  shopButtonText: {
    color: '#fff',
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: '#fff',
    width: '80%',
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  menuHeader: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  menuHeaderText: {
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  imagePickerContainer: {
    backgroundColor: '#fff',
    width: '90%',
    borderRadius: 15,
    overflow: 'hidden',
    padding: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 16,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  imagePickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  pickerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  imagePickerText: {
    fontSize: 16,
    color: '#333',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#007bff',
    fontSize: 16,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
});

export default HomeScreen;
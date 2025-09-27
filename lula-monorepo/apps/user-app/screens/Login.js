import React, { useRef, useState } from 'react'
import { StyleSheet, Text, View, TouchableOpacity, TextInput } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useNavigation } from '@react-navigation/native'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import WebCompatiblePhoneInput from '../components/ui/WebCompatiblePhoneInput'
import { handleError } from '../utils/function'
import showToast from '../utils/toast'
import AuthService from '../services/NewAuthService'
import SubmitButton from '../components/ui/SubmitButton'
import { useDispatch } from 'react-redux'
import Loading from '../components/shared/Loading'
import { setUser } from '../store/slices/auth'
import AsyncStorage from '@react-native-async-storage/async-storage';

const Login = () => {
    const dispatch = useDispatch()
    const navigation = useNavigation()
    const phoneInput = useRef()
    const inputs = useRef([])
    const [otp, setOtp] = useState(['', '', '', '', '', ''])

    const [phoneNumber, setPhoneNumber] = useState('')
    const [isOtpSent, setIsOtpSent] = useState(false)
    const [confirmation, setConfirmation] = useState(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [selectedCountryCode, setSelectedCountryCode] = useState({
        callingCode: ['91'],
        cca2: 'IN',
        currency: ['INR'],
        flag: 'flag-in',
        name: 'India',
        region: 'Asia',
        subregion: 'Southern Asia',
    })
const handleRegister = async () => {
  try {
    if (!phoneInput.current?.isValidNumber(phoneNumber)) {
      showToast('Phone Number is Not Valid')
      return
    }
    setIsSubmitting(true)
    const fullPhoneNumber = `+${phoneInput.current.state.code}${phoneInput.current.state.number}`

    const res = await AuthService.register(fullPhoneNumber)
    if (!res.error) {
      const userId = res.user.id
      console.log(res.user)
      await AuthService.updateStatusShow(userId, true)
      dispatch(setUser(res.user))
      showToast('Phone number verified successfully!', 'success')
      await AsyncStorage.setItem('loggedInUserId', res.user.id)

      navigation.reset({
        index: 0,
        routes: [{ name: res.user.profileCompleted ? (res.user.status ? 'Main' : 'PendingVerification') : 'CreateProfile' }],
      })
    } else {
      showToast(res.message || 'Failed to send OTP')
    }
  } catch (error) {
    handleError(error)
  } finally {
    setIsSubmitting(false)
  }
}

const handleVerifyOtp = async () => {
  try {
    if (!otp.every((item) => item)) {
      showToast('Please enter the OTP')
      return
    }
    setIsSubmitting(true)
    const res = await AuthService.verifyOtp(otp.join(''))

    if (!res.error) {
      const userId = res.user.id
      await AuthService.updateStatusShow(userId, true)
      dispatch(setUser(res.user))
      showToast('Phone number verified successfully!', 'success')
      await AsyncStorage.setItem('loggedInUserId', res.user.id)

      navigation.reset({
        index: 0,
        routes: [{ name: res.user.profileCompleted ? (res.user.status ? 'Main' : 'PendingVerification') : 'CreateProfile' }],
      })
    } else {
      showToast(res.message || 'Invalid OTP')
    }
  } catch (error) {
    handleError(error)
  } finally {
    setIsSubmitting(false)
  }
}


    const handleOtpChange = (text, index) => {
        const updatedOtp = [...otp]
        updatedOtp[index] = text
        setOtp(updatedOtp)

        // Automatically focus on the next input
        if (text && index < otp.length - 1) {
            inputs.current[index + 1]?.focus()
        }
    }

    const handleBackspace = (text, index) => {
        if (!text && index > 0) {
            inputs.current[index - 1]?.focus()
        }
    }



    return (
        <LinearGradient colors={['rgba(97, 86, 226, 0.9)', 'rgba(171, 73, 161, 0.9)', 'rgba(171, 73, 161, 0.9)', 'rgba(171, 73, 161, 0.9)']} style={styles.gradient}>
            <Loading isVisible={isSubmitting} />
            {isOtpSent && (
                <TouchableOpacity style={styles.back} onPress={() => setIsOtpSent(false)}>
                    <MaterialIcons name="keyboard-backspace" size={25} color="white" />
                </TouchableOpacity>
            )}
            <View style={styles.content}>
                <Text style={styles.heading}>{isOtpSent ? 'Enter OTP' : 'Continue with Phone Number'}</Text>
                <Text style={styles.smallText}>{isOtpSent ? 'Please enter the OTP sent to your phone number' : 'A verification code will be sent to this number'}</Text>
                {!isOtpSent ? (
                    <View className="my-4 bg-gray-50">
                        <WebCompatiblePhoneInput
                            ref={phoneInput}
                            defaultCode={selectedCountryCode.cca2}
                            layout="first"
                            className="w-full mb-4"
                            onChangeCountry={(country) => setSelectedCountryCode(country)}
                            onChangeText={(text) => setPhoneNumber(text)}
                            autoFocus
                        />
                    </View>
                ) : (
                    <View className="my-4">
                        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
                            {otp.map((digit, index) => (
                                <TextInput
                                    key={index}
                                    ref={(ref) => (inputs.current[index] = ref)}
                                    value={digit}
                                    onChangeText={(text) => handleOtpChange(text, index)}
                                    onKeyPress={({ nativeEvent }) => {
                                        if (nativeEvent.key === 'Backspace') handleBackspace(digit, index)
                                    }}
                                    maxLength={1}
                                    keyboardType="number-pad"
                                    style={{
                                        width: 40,
                                        height: 40,
                                        textAlign: 'center',
                                        borderWidth: 1,
                                        borderColor: '#D1D5DB',
                                        marginHorizontal: 8,
                                        borderRadius: 8,
                                        fontSize: 18,
                                    }}
                                />
                            ))}
                        </View>
                    </View>
                )}

                <View style={styles.buttonContainer}>
                    <SubmitButton title={isOtpSent ? 'Verify OTP' : 'Continue'} onPress={isOtpSent ? handleVerifyOtp : handleRegister} />
                </View>
            </View>
        </LinearGradient>
    )
}

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
        width: '100%',
        justifyContent: 'flex-end',
        padding: 0,
    },
    back: {
        position: 'absolute',
        left: 15,
        top: 15,
    },
    content: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 40,
        width: '100%',
        paddingHorizontal: 20,
        height: '80%',
        backgroundColor: '#fff',
    },
    heading: {
        fontSize: 19,
    },
    smallText: {
        fontSize: 11,
        marginBottom: 15,
    },
    input: {
        width: '100%',
        padding: 10,
        borderWidth: 1,
        borderColor: 'gray',
        borderRadius: 10,
        fontSize: 16,
        marginBottom: 20,
    },
    buttonContainer: {
        marginTop: 20,
    },
    button2: {
        backgroundColor: 'white',
        width: '100%',
        paddingVertical: 13,
        paddingHorizontal: 15,
        borderRadius: 45,
        justifyContent: 'center',
        flexDirection: 'row',
        marginBottom: 10,
    },
})

export default Login

import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    FlatList,
    Animated,
    Image,
    ImageBackground,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const slides = [
    {
      id: '1',
      image: require('../assets/images/one.png'),
      title: 'Let’s Go Live! Your Seat is Reserved',
      description: 'Start your streaming journey with professional tools and an engaged community.',
    },
    {
      id: '2',
      image: require('../assets/images/two.png'),
      title: 'Live & Connected: Join the Conversation!',
      description: 'Interact with viewers in real-time through chat, polls, and interactive features.',
    },
    {
      id: '3',
      image: require('../assets/images/three.png'),
      title: 'Create. Connect. Go Live!',
      description: 'Get discovered, build your community, and turn your passion into success.',
    },
];

export default function Onboarding() {
    const navigation = useNavigation();
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;
    const slidesRef = useRef(null);

    const viewableItemsChanged = useRef(({ viewableItems }) => {
        setCurrentIndex(viewableItems[0]?.index ?? 0);
    }).current;

    const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    const scrollTo = () => {
        if (currentIndex < slides.length - 1) {
            slidesRef.current.scrollToIndex({ index: currentIndex + 1 });
        }
    };

    const Paginator = () => {
        return (
            <View style={styles.paginatorContainer}>
                {slides.map((_, index) => {
                    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

                    const dotWidth = scrollX.interpolate({
                        inputRange,
                        outputRange: [10, 20, 10],
                        extrapolate: 'clamp',
                    });

                    const opacity = scrollX.interpolate({
                        inputRange,
                        outputRange: [0.3, 1, 0.3],
                        extrapolate: 'clamp',
                    });

                    return (
                        <Animated.View
                            style={[
                                styles.dot,
                                {
                                    width: dotWidth,
                                    opacity,
                                },
                            ]}
                            key={index}
                        />
                    );
                })}
            </View>
        );
    };

    const renderItem = ({ item }) => {
        return (
            <View style={styles.slide}>
                <Image
                    source={item.image}
                    style={styles.image}
                    contentFit="contain"
                    transition={1000}
                />
                <View style={styles.textContainer}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.description}>{item.description}</Text>
                </View>
            </View>
        );
    };

    return (
        <ImageBackground
            source={require('../assets/images/login/bg.png')}
            style={styles.container}
        >
            <LinearGradient
                colors={['rgba(97, 86, 226, 0.9)', 'rgba(171, 73, 161, 0.9)']}
                style={styles.gradient}
            >
                <View style={styles.flatListContainer}>
                    <FlatList
                        data={slides}
                        renderItem={renderItem}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        pagingEnabled
                        bounces={false}
                        keyExtractor={(item) => item.id}
                        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
                            useNativeDriver: false,
                        })}
                        scrollEventThrottle={32}
                        onViewableItemsChanged={viewableItemsChanged}
                        viewabilityConfig={viewConfig}
                        ref={slidesRef}
                    />
                </View>

                <View style={styles.footer}>
                    {currentIndex === slides.length - 1 ? (
                        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')} asChild>
                            <Text style={styles.buttonText}>Get Started</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.button} onPress={scrollTo}>
                            <Text style={styles.buttonText}>Next</Text>
                        </TouchableOpacity>
                    )}
                    <Paginator />
                </View>
            </LinearGradient>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
    },
    gradient: {
        flex: 1,
        width: '100%',
        padding: 0,
    },
    flatListContainer: {
        flex: 1,
    },
    slide: {
        width,
        height,
        alignItems: 'center',
    },
    image: {
        flex: 0.6,
        marginTop: 30,
        width: '80%',
        objectFit:'contain',
    },
    textContainer: {
        flex: 0.2,
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginBottom: 50,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 10,
        color: '#fff',
        textAlign: 'center',
    },
    description: {
        fontSize: 13,
        color: '#fff',
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    footer: {
        flex: 0.2,
        alignItems: 'center',
        marginBottom: 20,
        width: '100%',
        paddingHorizontal: 20,
    },
    paginatorContainer: {
        flexDirection: 'row',
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dot: {
        height: 10,
        borderRadius: 5,
        backgroundColor: '#fff',
        marginHorizontal: 4,
    },
    button: {
        backgroundColor: '#fff',
        padding: 15,
        width: '100%',
        paddingHorizontal: 30,
        borderRadius: 30,
        marginTop: 5,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        textAlign: 'center',
    },
});
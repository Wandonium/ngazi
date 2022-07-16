import { fas } from '@fortawesome/free-solid-svg-icons';
import React, { useState, useRef, useEffect } from 'react';
import './createAdvert.css';
import Loading from "./loading";
const { BlobServiceClient } = require("@azure/storage-blob");

function CreateAdvert(props) {
    const [advert, setAdvert] = useState({
        name: '',
        desc: '',
        startTime: '',
        endTime: '',
        clientId: '619a5c7617edba0464519789',
        addedBy: '61888ab1e4c5ef487c4f118e',
        tvImages: [],
        wifiImages: [],
        deviceIds: ['6199f5a97af3bf0ee03eb591','6199f5a97af3bf0ee03eb590'],
        videoUrl: '',
        videoName: '',
        videoDuration: '',
        videoWidth: '',
        videoHeight: '',
        videoUploadDone: false
    });
    const [loading, setLoading] = useState(false);
    const [loading2, setLoading2] = useState(false);
    const [imageUploadDone, setImageUploadDone] = useState(false);
    const [inputError, setInputError] = useState('');
    const [tvImages, setTvImages] = useState([]);
    const [wifiImages, setWifiImages] = useState([]);
    const [vidUrl, setVidUrl] = useState('');
    const [msg, setMsg] = useState('');

    const player = useRef(null);
    let tvFiles = [];
    let wifiFiles = [];
    
    const blobService = new BlobServiceClient(
        `https://ngazi.blob.core.windows.net/${process.env.REACT_APP_BLOB_STORE_SECRET_SAS_KEY}`
      );
    const containerClient = blobService.getContainerClient("ngazi-files");

    useEffect(() => {
        if(player.current) {
          const video = player.current;
          video.play(); 
          video.addEventListener('loadedmetadata', () => {
            let w = video.videoWidth;
            let h = video.videoHeight;
            console.log(`w: ${w}; h: ${h}`);
            if(w != undefined && h != undefined) {
                // console.log('video width: ', w);
                // console.log('video height: ', h);
                setAdvert({
                    ...advert, 
                    videoUrl: vidUrl,
                    videoDuration: `${video.duration} seconds`,
                    videoWidth: w, 
                    videoHeight: h,
                    videoUploadDone: true
                });
            }
          });
        }
    });

    useEffect(() => {
        console.log('advert: ', JSON.stringify(advert, null, 2));
        if(advert.videoUploadDone) {
            createAdvert();
        }
    }, [advert]);

    useEffect(() => {
        setMsg('Processing uploaded images, please wait......');
        if(imageUploadDone) {
            let tmpArr = [];
            const loadImg = (image, idx, type) => {
                const origArr = type === 'tv' ? tvImages : wifiImages;
                const img = new Image();
                img.src = image.url;
                img.onload = () => {
                    console.log(`${image.systemFilename} height: ${img.height}`);
                    console.log(`${image.systemFilename} width: ${img.width}`);
                    tmpArr.push({
                        filename: image.filename,
                        systemFilename: image.systemFilename,
                        url: image.url,
                        width: img.width,
                        height: img.height
                    });  
                    idx++;
                    if(idx < origArr.length) {
                        loadImg(origArr[idx], idx, type);
                    } else {
                        // console.log('tmpArr: ', tmpArr);
                        if(type === 'tv') {
                            setTvImages(tmpArr);
                            tmpArr = [];
                            setMsg(`Processing ${wifiImages.length} WiFi Banner Ad images, please wait....`);
                            loadImg(wifiImages[0], 0, 'wifi');
                        } else {
                            setWifiImages(tmpArr);
                        }
                    }
                };
            };
            setMsg(`Processing ${tvImages.length} TV Banner Ad images, please wait....`);
            loadImg(tvImages[0], 0, 'tv');
        }
    }, [imageUploadDone]);

    useEffect(() => {
        if(imageUploadDone) {
            console.log('tvImages: ', tvImages);
            console.log('wifiImages: ', wifiImages);
            setAdvert({...advert, tvImages: [...tvImages], wifiImages: [...wifiImages]});
            uploadVideoFile();
        }
    }, [wifiImages]);


    const handleSubmit = (event) => {
        event.preventDefault();
        let vidOk = checkVideoInput();
        let imgOk = checkImageInput();
        if(advert.name === '') {
            setInputError("Please provide the advert's name!")
        }

        if(advert.desc === '') {
            setInputError("Please provide the advert's description!");
        }

        if(vidOk && imgOk) {
            // console.log("Call getUploadUrl!");
            uploadImageFiles();
        } else {
            // console.log('vidOk: ', vidOk);
            // console.log("imgOk: ", imgOk);
        }
        
    }

    const checkImageInput = () => {
        const tvImageInput = document.getElementById('tv-images');
        const wifiImageInput = document.getElementById('wifi-images');
        tvFiles = Object.values(tvImageInput.files);
        wifiFiles = Object.values(wifiImageInput.files);
        let val = true;
        const checkFile = (imageFile) => {           
            if (!imageFile.name.match(/\.(jpg|jpeg|png|gif)$/)) {
                setInputError('Invalid image file! Please select a valid image.');
                return false;
            }
    
            const fsize = Math.round((imageFile.size / 1024));
            // console.log('file size: ', fsize);
            if(fsize > 5120) {
                setInputError('Fatal Error! Image file cannot be larger than 5MB');
                return false;
            }
            return true;
        };

        if(
            tvFiles.length === 0 ||
            wifiFiles.length === 0
        ) {
            setInputError('Tv Image or Wifi Image field is empty! Please select an image.' );
            return false; 
        }

        if(tvFiles.length > 2) {
            setInputError('Please select a maximum of 2 files for the TV Banner Ad!');
            return false;
        }

        if(wifiFiles.length > 1) {
            setInputError('Please select only one file for the WiFi Banner Ad!');
            return false;
        }

        val = tvFiles.every(file => {
            if(!checkFile(file)) {
                return false;
            }
            return true;
        });

        val = wifiFiles.every(file => {
            if(!checkFile(file)) {
                return false;
            }
            return true;
        });
        return val;
    }

    const checkVideoInput = () => {
        const videoInput = document.getElementById('video');
        const videoFile = videoInput.files[0];
        
        if (!videoFile) {
            setInputError('Video field is empty! Please select a video file.' );
            return false;
        }

        if(videoInput.files[1]) {
            setInputError('Please select only one video file for the Video Advert!');
            return false;
        }
       
        if (!videoFile.name.match(/\.(mp4|avi|3gp|flv|mov|webm|mpeg-4)$/)) {
            setInputError('Invalid video file! Please select a valid video.');
            return false;
        }

        const fsize = Math.round((videoFile.size / 1024));
        // console.log('file size: ', fsize);

        if(fsize > 51200) {
            setInputError('Fatal Error! Video file cannot be larger than 50MB');
            return false;
        }

        setAdvert({...advert, videoName: videoFile.name});
        return true;
    }

    const uploadImageFiles = async () => {
        setMsg('Uploading your data, please wait.....');
        setLoading(true);
        // console.log('backendUrl: ', props.backendUrl);
        // let tvImages = [];
        // let wifiImages = [];
        const uploadImage = (idx, type) => {
            let imageArr, folder, resultArr;
            if(type === 'tv') {
                resultArr = tvImages;
                imageArr = tvFiles;
                folder = '/TV-Images/';
            } else {
                resultArr = wifiImages;
                imageArr = wifiFiles;
                folder = '/WIFI-Images/';
            }
            const file = imageArr[idx];
            const location = advert.name + folder + file.name;
            const imageBlobClient = containerClient.getBlockBlobClient(location);
            imageBlobClient.upload(file, file.size, {
                blobHTTPHeaders: {
                    blobContentType: file.type
                }
            })
            .then(res => {
                let theUrl = res._response.request.url;
                // console.log(`${file.name}'s url: ${theUrl}`);
                resultArr.push({
                    filename: file.name,
                    systemFilename: location,
                    url: theUrl,
                    width: '',
                    height: ''
                });
                idx++;

                if(idx < imageArr.length) {
                    uploadImage(idx, type);
                } else {
                    if(type === 'tv') {
                        setTvImages([...resultArr]);
                        setMsg(`Uploading ${wifiFiles.length} WiFi Banner Ad images, please wait.....`);
                        uploadImage(0, 'wifi');
                    } else {
                        setWifiImages([...resultArr]);
                        // console.log('Done uploading images to blob store!');
                        // setLoading(false);
                        setImageUploadDone(true);
                    }
                }
            }).catch(err => {
                setLoading(false);
                console.error('error uploading images: ', err)
            });
        }
        setMsg(`Uploading ${tvFiles.length} TV Banner Ad images, please wait.....`);
        uploadImage(0, 'tv');
    }

    const uploadVideoFile = () => {
        const videoInput = document.getElementById("video");
        const video = videoInput.files[0];
        const bytes = video.size * 1024;
        const blockBlobClient = containerClient.getBlockBlobClient(advert.name + '/WIFI-Video/' + video.name);
        blockBlobClient.uploadBrowserData(
            video, {
                onProgress: ev => {
                    let progress = parseInt(((ev.loadedBytes/bytes) * 100000).toString(), 10);
                    // console.log('progress: ' + progress + '%');
                    // setProgress(progress);
                    setMsg(`Uploading video Ad, please wait....${progress}%`);
                },
                blobHTTPHeaders: {
                    blobContentType: video.type
                }
            }
        ).then(res => {
            let url = res._response.request.url
            // console.log('progress:  100%');
            // console.log('video url: ', url);
            setVidUrl(url);
            setLoading(false);
        }).catch(err => {
            console.error('err: ', err);
            setLoading(false);
        });
    }

    const handleChange = (event) => {
        let tmp = advert;
        tmp[event.target.name] = event.target.value;
        setAdvert(tmp);
    }

    const createAdvert = () => {
        console.log('advert object before creating it in db: ', advert);
        const requestOptions = {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({...advert}),
        };
        // player.current.pause();
        // setLoading2(true);
        fetch(`${props.backendUrl}/api/v1/adverts`, requestOptions)
        .then(res => res.json())
        .then(data => {
            // setLoading2(false);
            console.log('create advert data: ', data);
        })
        .catch(err => {
            // setLoading2(false);
            console.log('create advert error: ', err);
        })
    }

    return (
        <div className="top center-column">
            {
                (inputError !== '') && (
                    <p style={{color: 'red', fontSize: 16}}>
                        {inputError}
                    </p>
                )
            }
            <form onSubmit={handleSubmit} className="center-column">
                <input className="m1" type="text" name="name" placeholder="Enter Advert name" onChange={handleChange} />
                <textarea className="m1" name="desc" cols="60" rows="10" onChange={handleChange} placeholder="Enter Advert Description" />
                <input className="m1" type="datetime-local" id="startTime" name="startTime" placeholder="Enter Advert Campaign's start date and time" onChange={handleChange} />
                <input className="m1" type="datetime-local" id="endTime" name="endTime" placeholder="Enter Advert Campaign's end date and time" onChange={handleChange} />
                <div className="m1">
                    <label>Select image file(s) for the TV banner Ads:</label>
                    <input type="file" accept="image/*" id="tv-images" multiple />
                </div>
                <div className="m1">
                    <label>Select image file(s) for the WIFI banner Ads:</label>
                    <input type="file" accept="image/*" id="wifi-images" multiple />
                </div>
                <div className="m1">
                    <label>Select a video file for the advert:</label>
                    <input type="file" accept="video/*" id="video" multiple />
                </div>
                <input className="m1" type='submit' value='Submit' />
            </form>
            {
                loading && (
                    <div>
                        <div style={{
                            display: 'flex', 
                            flexDirection: 'column', 
                            justifyContent: 'center', 
                            alignItems: 'center',
                            marginTop: 20
                        }}>
                            <Loading />
                            <h1>{msg}</h1>
                            {/* <h1>{'Uploading video...  ' + progress + '%'}</h1> */}
                        </div>
                    </div>
                )
             }
             { vidUrl !== '' && !loading && (
                    <video
                        id="myVideo"
                        src={vidUrl}
                        ref={player}
                        controls={true}
                    />
                )
            }
            {/*
                loading2 && (
                    <div>
                        <div style={{
                            display: 'flex', 
                            flexDirection: 'column', 
                            justifyContent: 'center', 
                            alignItems: 'center',
                            marginTop: 20
                        }}>
                            <Loading />
                            <h1>{`Creating Advert: ${advert.name}, please wait....`}</h1>
                        </div>
                    </div>
                )
             */}
        </div>
    )
}

export default CreateAdvert

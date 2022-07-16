import React, { useState, useRef, useEffect } from 'react';
import './musicVideo.css';
import Loading from "./loading";
const { BlobServiceClient } = require("@azure/storage-blob");


function MusicVideo(props) {
    const [video, setVideo] = useState({
        title: '',
        description: '',
        image_url: '',
        url: '',
        duration: '',
        width: '',
        height: '',
        addedBy: '61888ab1e4c5ef487c4f118e',
        uploadDone: false,
        playlist_id: null,
    });
    const [loading, setLoading] = useState(false);
    const [inputError, setInputError] = useState('');
    const [imgUrl, setImgUrl] = useState('');
    const [vidUrl, setVidUrl] = useState('');
    const [msg, setMsg] = useState('');
    const player = useRef(null);

    const blobService = new BlobServiceClient(
        `https://ngazi.blob.core.windows.net/${process.env.REACT_APP_BLOB_STORE_SECRET_SAS_KEY}`
      );
    const containerClient = blobService.getContainerClient("music-videos");

    useEffect(() => {
        if(player.current) {
            const vid = player.current;
            vid.play(); 
            vid.addEventListener('loadedmetadata', () => {
                let videoDuration = vid.duration / 60;
                setVideo({
                    ...video, 
                    image_url: imgUrl,
                    url: vidUrl,
                    duration: `${videoDuration} minutes`,
                    width: vid.videoWidth, 
                    height: vid.videoHeight,
                    uploadDone: true
                });
            });
        }
    });

    useEffect(() => {
        console.log('video: ', JSON.stringify(video, null, 2));
        if(video.uploadDone) {
            createVideo();
        }
    }, [video]);

    const checkImageInput = () => {
        const imageInput = document.getElementById('image');
        const imageFile = imageInput.files[0];
        
        if (!imageFile) {
            setInputError('Image field is empty! Please select an image.' );
            return false;
        }
       
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
    }

    const checkVideoInput = () => {
        const videoInput = document.getElementById('video');
        const videoFile = videoInput.files[0];
        
        if (!videoFile) {
            setInputError('Video field is empty! Please select a video file.' );
            return false;
        }
       
        if (!videoFile.name.match(/\.(mp4|avi|3gp|flv|mov|webm|mpeg-4)$/)) {
            setInputError('Invalid video file! Please select a valid video.');
            return false;
        }

        const fsize = Math.round((videoFile.size / 1024));
        console.log('file size: ', fsize);

        if(fsize > 2097152) {
            setInputError('Fatal Error! Video file cannot be larger than 50MB');
            return false;
        }

        return true;
    }

    const handleChange = (event) => {
        let tmp = video;
        tmp[event.target.name] = event.target.value;
        setVideo(tmp);
    }

    const handleSubmit = (event) => {
        event.preventDefault();
        let vidOk = checkVideoInput();
        let imgOk = checkImageInput();

        if(video.title === '') {
            setInputError("Please provide the video's title!")
            return;
        }
        
        if(video.description === '') {
            setInputError("Please provide the video's description!");
            return;
        }

        if(vidOk && imgOk) {
            console.log("Call getUploadUrl!");
            uploadImage();
        } else {
            console.log('vidOk: ', vidOk);
            console.log("imgOk: ", imgOk);
        }
        
    }

    const uploadImage = () => {
        const imageInput = document.getElementById('image');
        const file = imageInput.files[0];
        let videoId = file.name.substring(0, file.name.indexOf('.'));
        let extension = file.name.substring(file.name.indexOf('.'), file.name.length);
        const location = video.title + '/thumbnail' + extension;
        const imageBlobClient = containerClient.getBlockBlobClient(location);;
        setMsg('Uploading video thumbnail, please wait....');
        setLoading(true);
        imageBlobClient.upload(file, file.size, {
            blobHTTPHeaders: {
                blobContentType: file.type
            }
        })
        .then(res => {
            let theUrl = res._response.request.url;
            console.log('image azure blob store url: ', theUrl);
            setImgUrl(theUrl);
            uploadVideo(videoId);
        }).catch(err => {
            setLoading(false);
            console.error('error uploading music video thumbnail: ', err);
        })
    }

    const uploadVideo = (videoId) => {
        const videoInput = document.getElementById('video');
        const file = videoInput.files[0];
        const bytes = file.size * 1024;
        const extension = file.name.substring(file.name.indexOf('.'), file.name.length);
        const location = video.title + '/' + videoId + extension;
        const videoBlobClient = containerClient.getBlockBlobClient(location);
        setMsg('Video thumbnail uploaded successfully 👍. Preparing the music video 🎬🎧 for upload...');
        videoBlobClient.uploadBrowserData(
            file, {
                onProgress: ev => {
                    let progress = parseInt(((ev.loadedBytes/bytes) * 100000).toString(), 10);
                    // console.log('progress: ' + progress + '%');
                    setMsg(`Uploading video, please wait......${progress}%`);
                },
                blobHTTPHeaders: {
                    blobContentType: file.type
                }
            }
        ).then(res => {
            let url = res._response.request.url;
            url = url.replace('&comp=blocklist', '');
            // console.log('video url: ', url);
            setMsg('Done uploading music video!👍');
            setVidUrl(url);
            setLoading(false);
        }).catch(err => {
            console.error('error uploading music video: ', err);
            setLoading(false);
        })
    }

    const createVideo = () => {
        console.log('video object before creating it in db: ', video);
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({...video})
        };
        // setMsg('Creating music video, please wait....');
        // setLoading(true);
        fetch(`${props.backendUrl}/api/v1/musicVideos`, requestOptions)
        .then(res => res.json())
        .then(data => {
            console.log('create music video data: ', data);
            // setLoading(false);
        })
        .catch(err => {
            console.log('create music video error: ', err);
            // setLoading(false);
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
                <input className="m1" type="text" name="title" placeholder="Enter Video Title" onChange={handleChange} />
                <textarea className="m1" name="description" cols="60" rows="10" onChange={handleChange} placeholder="Enter Video Description" />
                <div className="m1">
                    <label>Select an image file for the video thumbnail:</label>
                    <input type="file" accept="image/*" id="image" />
                </div>
                <div className="m1">
                    <label>Select the music video file:</label>
                    <input type="file" accept="video/*" id="video" />
                </div>
                <input className="m1" type='submit' value='Submit' />
            </form>
            {
                loading && (
                    <div style={{
                            display: 'flex', 
                            flexDirection: 'column', 
                            justifyContent: 'center', 
                            alignItems: 'center',
                            marginTop: 20
                    }}>
                        <Loading />
                        <h3>{msg}</h3>
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
        </div>
    )
}

export default MusicVideo;

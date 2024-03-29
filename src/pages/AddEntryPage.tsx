import { 
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent, 
  IonHeader, 
  IonInput, 
  IonItem, 
  IonLabel, 
  IonList, 
  IonPage,  
  IonTextarea,  
  IonTitle, 
  IonToolbar,
  isPlatform
} from '@ionic/react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import React, { useEffect, useRef, useState } from 'react';
import { firestore, storage } from '../firebase';
import { addDoc, collection } from '@firebase/firestore';
import { getDownloadURL, ref as storageRef, uploadBytes } from '@firebase/storage';
import { useAuth } from '../auth';
import { useHistory } from 'react-router';

async function savePicture(blobUrl, userId) {
  const pictureRef = storageRef(storage, `/users/${userId}/pictures/${Date.now()}`);
  const response = await fetch(blobUrl);
  const blob = await response.blob();
  const snapshot = await uploadBytes(pictureRef, blob);
  const url = getDownloadURL(snapshot.ref);
  console.log('saved picture:', url);
  return url;
}

const AddEntryPage: React.FC = () => {
  const { userId } = useAuth();
  const history = useHistory();
  const [ date, setDate ] = useState('');
  const [ title, setTitle ] = useState('');
  const [ pictureUrl, setPictureUrl ] = useState('/assets/placeholder.png');
  const [ description, setDescription ] = useState('');
  const fileInputRef = useRef<HTMLInputElement>();

  useEffect(() => () => {
    if (pictureUrl.startsWith('blob:')) {
      URL.revokeObjectURL(pictureUrl);
      // console.log('revoke URL:', pictureUrl);
    }
  }, [pictureUrl]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files.length > 0) {
      const file = event.target.files.item(0);
      const pictureUrl = URL.createObjectURL(file);
      // console.log('created URL:', pictureUrl);
      setPictureUrl(pictureUrl);
    }
  }

  const handlePictureClick = async () => {
    if (isPlatform('capacitor')){
      try {
        const photo = await Camera.getPhoto({
          resultType: CameraResultType.Uri,
          source: CameraSource.Prompt,
          width: 600,
        });
        setPictureUrl(photo.webPath);
      } catch (error) {
        console.log('Camera error:', error);
      }
    } else {
      fileInputRef.current.click();
    }
  };

  const handleSave = async () => {
    const entriesRef = collection(firestore, 'users', userId, 'entries');
    const entryData = { date, title, pictureUrl, description };
    if (!pictureUrl.startsWith('/assets')) {
      entryData.pictureUrl = await savePicture(pictureUrl, userId);
    }

    const entryRef = await addDoc(entriesRef, entryData);
    console.log('saved:', entryRef.id);
    history.goBack();
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton />
          </IonButtons>
          <IonTitle>Add Entry</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonList>
        <IonItem>
            <IonLabel position="stacked">Date</IonLabel>
            <IonInput type="date" value={date}
              onIonChange={(event) => setDate(event.detail.value)} />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Title</IonLabel>
            <IonInput value={title}
              onIonChange={(event) => setTitle(event.detail.value)} />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Picture</IonLabel><br />
            <input type="file" accept="image/*" hidden ref={fileInputRef}
              onChange={handleFileChange}
            />
            <img src={pictureUrl} alt="" style={{ cursor: 'pointer' }}
            onClick={handlePictureClick} />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Description</IonLabel>
            <IonTextarea value={description}
              onIonChange={(event) => setDescription(event.detail.value)} />
          </IonItem>
          <IonButton expand="block" onClick={handleSave} >Save</IonButton>
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default AddEntryPage;

import pdp from "../../assets/pdp1.png";
import "./ProfilePicture.css";

function ProfilePicture() {
    return(
        <div className="profile-picture">
            <img src={pdp} alt="Profile" />
        </div>
    );
}

export default ProfilePicture;
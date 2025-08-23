import React from 'react';
import './GaneshaRotatingAvatar.css';

const GaneshaRotatingAvatar: React.FC = () => {
  return (
    <div className="ganesh-avatar-container">
      <div className="divset">
        {/* Main rotating SVG */}
        <svg 
          className="rotate-center img_one" 
          version="1.1" 
          xmlns="http://www.w3.org/2000/svg" 
          xmlnsXlink="http://www.w3.org/1999/xlink" 
          x="0px" 
          y="0px"
          viewBox="0 0 500 500" 
          xmlSpace="preserve"
        >
          <style type="text/css">
            {`
              .st0{display:none;}
              .st1{display:inline;}
              .st2{clip-path:url(#SVGID_2_);fill:#F16F00;}
              .st3{display:inline;opacity:0.4;}
              .st4{fill:#FCC000;}
              .st5{opacity:0.8;}
              .st6{fill:#FED394;}
              .st7{display:none;opacity:0.8;}
              .st8{display:none;fill:#FFE8CC;}
              .st9{display:none;fill:#FFFFFF;}
              .st10{display:none;opacity:0.5;}
              .st11{display:inline;fill:#FFE8CC;}
              .st12{fill:#C15E42;}
              .st13{opacity:0.3;}
              .st14{opacity:0.4;fill:#C15E42;}
              .st15{opacity:0.2;}
              .st16{fill:#FFFFFF;}
              .st17{fill:#F3A203;}
              .st18{fill:#FFC44D;}
              .st19{opacity:0.3;fill:#FFFFFF;}
              .st20{display:inline;fill:#C15E42;}
              .st21{font-family:'KaushanScript-Regular';}
              .st22{font-size:42.7014px;}
              .st23{display:inline;fill:#F3A203;}
              .st24{font-family:'PlayfairDisplay-Bold';}
              .st25{font-size:13.0421px;}
              .st26{letter-spacing:8;}
            `}
          </style>
          <g id="BACKGROUND" className="st0">
            <g className="st1">
              <defs>
                <rect id="SVGID_1_" width="500" height="500"/>
              </defs>
              <use xlinkHref="#SVGID_1_" style={{ overflow: 'visible', fill: '#F16F00' }}/>
              <clipPath id="SVGID_2_">
                <use xlinkHref="#SVGID_1_" style={{ overflow: 'visible' }}/>
              </clipPath>
              <rect x="-42" y="-40" className="st2" width="586" height="585"/>
            </g>
          </g>
          <g id="OBJECTS">
            <g className="st5">
              <circle className="st4" cx="250" cy="250" r="220"/>
              <circle className="st6" cx="250" cy="250" r="200"/>
            </g>
          </g>
        </svg>

        {/* Second rotating circle */}
        <img 
          className="img_two rotate-center-sec" 
          src="https://1.bp.blogspot.com/-zbTJP7CFU1o/XXiYo8bj14I/AAAAAAAATLc/YgdiMIILXq0LwaDbbyN-0Ew9katTRDUQQCLcBGAsYHQ/s1600/second_circle.png" 
          alt="Second circle" 
          height="800px" 
          width="800px"
        />
        
        {/* Third rotating circle */}
        <img 
          className="img_three rotate-center-third" 
          src="https://1.bp.blogspot.com/-_COGVBH4WyY/XXijt_rn5FI/AAAAAAAATL0/sCQhgcmjUl8amPCCquFtjEmmsxc_y_fyACLcBGAsYHQ/s1600/circle_third.png" 
          alt="Third circle" 
          height="500px" 
          width="500px"
        />
        
        {/* Central Ganesha image */}
        <div>
          <img 
            className="ganeshJee" 
            src="https://1.bp.blogspot.com/-SE1b77kYVek/XXnnVNN95NI/AAAAAAAATNY/44JshUd59xs9BG-jTUN-E6s3dgR0C3Q5ACLcBGAsYHQ/s1600/Ganesh.png" 
            alt="Lord Ganesha" 
            height="500px" 
            width="500px"
          />
        </div>
      </div>
    </div>
  );
};

export default GaneshaRotatingAvatar;
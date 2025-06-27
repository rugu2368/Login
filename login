<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Login & Signup Form</title>
  <link href="https://fonts.googleapis.com/css?family=Poppins:400,500,600,700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: 'Poppins', sans-serif;
    }

    html, body {
      height: 100%;
      width: 100%;
      display: grid;
      place-items: center;
      background: linear-gradient(to right, #003366, #004080, #0059b3, #0073e6);
    }

    ::selection {
      background: #1a75ff;
      color: #fff;
    }

    .wrapper {
      width: 390px;
      background: #fff;
      padding: 30px;
      border-radius: 15px;
      box-shadow: 0px 15px 20px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    .title-text {
      display: flex;
      width: 200%;
    }

    .title {
      width: 50%;
      font-size: 35px;
      font-weight: 600;
      text-align: center;
      transition: all 0.6s ease;
    }

    .form-container {
      width: 100%;
      overflow: hidden;
    }

    .slide-controls {
      position: relative;
      display: flex;
      height: 50px;
      width: 100%;
      margin: 30px 0 10px;
      justify-content: space-between;
      border: 1px solid lightgrey;
      border-radius: 15px;
      overflow: hidden;
    }

    .slide-controls .slide {
      width: 100%;
      text-align: center;
      line-height: 48px;
      font-size: 18px;
      font-weight: 500;
      cursor: pointer;
      z-index: 1;
      color: #000;
      transition: all 0.6s ease;
    }

    .slider-tab {
      position: absolute;
      width: 50%;
      height: 100%;
      left: 0;
      background: linear-gradient(to right, #003366, #004080, #0059b3, #0073e6);
      border-radius: 15px;
      transition: all 0.6s ease;
      z-index: 0;
    }

    input[type="radio"] {
      display: none;
    }

    #signup:checked ~ .slider-tab {
      left: 50%;
    }

    #login:checked ~ label.login {
      color: #fff;
      cursor: default;
      user-select: none;
    }

    #signup:checked ~ label.signup {
      color: #fff;
      cursor: default;
      user-select: none;
    }

    .form-inner {
      display: flex;
      width: 200%;
      transition: all 0.6s ease;
    }

    .form-inner form {
      width: 50%;
    }

    .field {
      height: 50px;
      margin-top: 20px;
      width: 100%;
    }

    .field input {
      width: 100%;
      height: 100%;
      padding-left: 15px;
      font-size: 17px;
      border: 1px solid lightgrey;
      border-radius: 15px;
      outline: none;
      transition: all 0.3s ease;
    }

    .field input:focus {
      border-color: #1a75ff;
    }

    .field input::placeholder {
      color: #999;
      transition: all 0.3s ease;
    }

    .field input:focus::placeholder {
      color: #1a75ff;
    }

    .pass-link, .signup-link {
      margin-top: 10px;
      text-align: center;
    }

    .pass-link a,
    .signup-link a {
      color: #1a75ff;
      text-decoration: none;
    }

    .pass-link a:hover,
    .signup-link a:hover {
      text-decoration: underline;
    }

    .btn {
      height: 50px;
      margin-top: 20px;
      position: relative;
      overflow: hidden;
      border-radius: 15px;
    }

    .btn-layer {
      position: absolute;
      height: 100%;
      width: 300%;
      left: -100%;
      background: linear-gradient(to right, #003366, #004080, #0059b3, #0073e6);
      border-radius: 15px;
      transition: all 0.4s ease;
    }

    .btn:hover .btn-layer {
      left: 0;
    }

    .btn input[type="submit"] {
      position: relative;
      height: 100%;
      width: 100%;
      border: none;
      background: none;
      color: #fff;
      font-size: 20px;
      font-weight: 500;
      cursor: pointer;
      z-index: 1;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="title-text">
      <div class="title login">Login Form</div>
      <div class="title signup">Signup Form</div>
    </div>
    <div class="form-container">
      <div class="slide-controls">
        <input type="radio" name="slide" id="login" checked>
        <input type="radio" name="slide" id="signup">
        <label for="login" class="slide login">Login</label>
        <label for="signup" class="slide signup">Signup</label>
        <div class="slider-tab"></div>
      </div>
      <div class="form-inner">
        <form action="#" class="login">
          <div class="field">
            <input type="text" placeholder="Email Address" required>
          </div>
          <div class="field">
            <input type="password" placeholder="Password" required>
          </div>
          <div class="pass-link"><a href="#">Forgot password?</a></div>
          <div class="field btn">
            <div class="btn-layer"></div>
            <input type="submit" value="Login">
          </div>
          <div class="signup-link">Not a member? <a href="#" onclick="document.getElementById('signup').checked = true; moveSlider(); return false;">Signup now</a></div>
        </form>
        <form action="#" class="signup">
          <div class="field">
            <input type="text" placeholder="Email Address" required>
          </div>
          <div class="field">
            <input type="password" placeholder="Password" required>
          </div>
          <div class="field">
            <input type="password" placeholder="Confirm Password" required>
          </div>
          <div class="field btn">
            <div class="btn-layer"></div>
            <input type="submit" value="Signup">
          </div>
        </form>
      </div>
    </div>
  </div>

  <script>
    const loginRadio = document.getElementById("login");
    const signupRadio = document.getElementById("signup");
    const formInner = document.querySelector(".form-inner");
    const titleText = document.querySelector(".title-text");

    function moveSlider() {
      if (signupRadio.checked) {
        formInner.style.marginLeft = "-100%";
        titleText.style.marginLeft = "-50%";
      } else {
        formInner.style.marginLeft = "0%";
        titleText.style.marginLeft = "0%";
      }
    }

    loginRadio.addEventListener("change", moveSlider);
    signupRadio.addEventListener("change", moveSlider);
  </script>
</body>
</html>

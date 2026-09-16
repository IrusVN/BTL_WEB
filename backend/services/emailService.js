const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;

const createTransporter = async () => {
  console.log('Đang tạo transporter...');
  
  try {
    if (!process.env.CLIENT_ID || !process.env.CLIENT_SECRET || !process.env.REFRESH_TOKEN || !process.env.EMAIL) {
      console.log('Thiếu biến môi trường OAuth2, chuyển sang sử dụng phương thức dự phòng');
      throw new Error('Missing OAuth2 environment variables');
    }
    
    console.log('Đang cấu hình OAuth2 với email:', process.env.EMAIL);

    const oauth2Client = new OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      "https://developers.google.com/oauthplayground"
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.REFRESH_TOKEN
    });

    console.log('Đang lấy access token...');
    const accessToken = await new Promise((resolve, reject) => {
      oauth2Client.getAccessToken((err, token) => {
        if (err) {
          console.log("Lỗi khi lấy access token:", err);
          reject(err);
        }
        console.log('Đã nhận được access token');
        resolve(token);
      });
    });

    console.log('Tạo transporter với OAuth2...');
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.EMAIL,
        accessToken,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN
      },
      debug: true
    });

    await transporter.verify();
    console.log('Đã xác minh kết nối với email server');
    
    return transporter;
  } catch (error) {
    console.log("Lỗi khi tạo OAuth2 transporter:", error);
    console.log("Chuyển sang sử dụng phương thức xác thực thông thường...");
    
    try {
      if (!process.env.EMAIL || !process.env.EMAIL_PASSWORD) {
        console.log('Không tìm thấy thông tin email hoặc mật khẩu ứng dụng');
        throw new Error('Email credentials not found');
      }
      
      console.log('Tạo transporter với App Password cho email:', process.env.EMAIL);
      
      const backupTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
          user: process.env.EMAIL,
          pass: process.env.EMAIL_PASSWORD
        },
        debug: true
      });
      
      await backupTransporter.verify();
      console.log('Đã xác minh kết nối với email server (phương thức dự phòng)');
      
      return backupTransporter;
    } catch (backupError) {
      console.error('Lỗi khi tạo transporter dự phòng:', backupError);
      throw new Error('Không thể thiết lập kết nối email: ' + backupError.message);
    }
  }
};

exports.createTransporter = createTransporter;

exports.sendOrderConfirmationEmail = async (orderDetails, userEmail) => {
  try {
    console.log(`Chuẩn bị gửi email xác nhận đơn hàng đến: ${userEmail}`);
    
    if (!userEmail) {
      console.error('Không thể gửi email: Email người nhận không hợp lệ');
      return false;
    }
    
    const transporter = await createTransporter();
    
    let orderItemsHtml = '';
    orderDetails.orderItems.forEach(item => {
      orderItemsHtml += `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">
            <img src="${item.image}" alt="${item.name}" style="width: 50px; height: auto;">
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.price.toLocaleString('vi-VN')} VND</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${(item.price * item.quantity).toLocaleString('vi-VN')} VND</td>
        </tr>
      `;
    });
    
    console.log('Đang chuẩn bị nội dung email...');
    
    const mailOptions = {
      from: `"Shop" <${process.env.EMAIL}>`,
      to: userEmail,
      subject: `Xác nhận đơn hàng #${orderDetails._id}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Xác nhận đơn hàng</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 650px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-bottom: 3px solid #4CAF50;">
            <h1 style="color: #4CAF50; margin: 0;">Đơn hàng của bạn đã được xác nhận!</h1>
          </div>
          
          <div style="padding: 20px;">
            <p>Xin chào <b>${orderDetails.shippingInfo.fullName}</b>,</p>
            <p>Cảm ơn bạn đã đặt hàng. Chúng tôi rất vui được phục vụ bạn!</p>
            <p>Đơn hàng của bạn đang được xử lý và sẽ được giao trong thời gian sớm nhất.</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-left: 4px solid #4CAF50;">
              <h3 style="margin-top: 0;">Thông tin đơn hàng:</h3>
              <p><strong>Mã đơn hàng:</strong> ${orderDetails._id}</p>
              <p><strong>Ngày đặt hàng:</strong> ${new Date(orderDetails.createdAt).toLocaleDateString('vi-VN')}</p>
              <p><strong>Phương thức thanh toán:</strong> ${orderDetails.paymentInfo.method}</p>
              <p><strong>Trạng thái thanh toán:</strong> ${orderDetails.paymentInfo.status}</p>
              <p><strong>Trạng thái đơn hàng:</strong> ${orderDetails.orderStatus}</p>
            </div>
            
            <div style="margin: 20px 0;">
              <h3>Chi tiết đơn hàng:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background-color: #f2f2f2;">
                    <th style="padding: 10px; text-align: left;">Hình ảnh</th>
                    <th style="padding: 10px; text-align: left;">Sản phẩm</th>
                    <th style="padding: 10px; text-align: left;">Số lượng</th>
                    <th style="padding: 10px; text-align: left;">Đơn giá</th>
                    <th style="padding: 10px; text-align: left;">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  ${orderItemsHtml}
                </tbody>
              </table>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 15px; margin: 20px 0;">
              <h3>Tóm tắt đơn hàng:</h3>
              <p><strong>Tạm tính:</strong> ${orderDetails.itemsPrice.toLocaleString('vi-VN')} VND</p>
              <p><strong>Thuế:</strong> ${orderDetails.taxPrice.toLocaleString('vi-VN')} VND</p>
              <p><strong>Phí vận chuyển:</strong> ${orderDetails.shippingPrice === 0 ? 'Miễn phí' : orderDetails.shippingPrice.toLocaleString('vi-VN') + ' VND'}</p>
              <p style="font-size: 18px; font-weight: bold; color: #4CAF50;">
                <strong>Tổng cộng:</strong> ${orderDetails.totalPrice.toLocaleString('vi-VN')} VND
              </p>
            </div>
            
            <div style="margin: 20px 0;">
              <h3>Thông tin giao hàng:</h3>
              <p><strong>Người nhận:</strong> ${orderDetails.shippingInfo.fullName}</p>
              <p><strong>Địa chỉ:</strong> ${orderDetails.shippingInfo.address}, ${orderDetails.shippingInfo.city}</p>
              <p><strong>Số điện thoại:</strong> ${orderDetails.shippingInfo.phoneNo}</p>
            </div>
            
            <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.</p>
            <p>Trân trọng,<br>Đội ngũ hỗ trợ khách hàng</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd;">
            <p>© 2023 Shop. Tất cả các quyền được bảo lưu.</p>
            <p>Email này được gửi từ hệ thống tự động. Xin đừng trả lời email này.</p>
          </div>
        </body>
        </html>
      `
    };

    console.log('Đang gửi email...');
    const result = await transporter.sendMail(mailOptions);
    console.log('Email đã được gửi:', result.response);
    return true;
  } catch (error) {
    console.error('Lỗi khi gửi email:', error);
    
    try {
      console.log('Thử gửi lại với nội dung đơn giản hơn...');
      
      const backupTransporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL,
          pass: process.env.EMAIL_PASSWORD
        }
      });
      
      const simpleMail = {
        from: `"Shop" <${process.env.EMAIL}>`,
        to: userEmail,
        subject: `Xác nhận đơn hàng #${orderDetails._id}`,
        text: `
          Xin chào ${orderDetails.shippingInfo.fullName},
          
          Cảm ơn bạn đã đặt hàng. Đơn hàng #${orderDetails._id} của bạn đã được xác nhận.
          
          Tổng giá trị đơn hàng: ${orderDetails.totalPrice.toLocaleString('vi-VN')} VND
          
          Cảm ơn bạn đã mua sắm cùng chúng tôi!
        `,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Xác nhận đơn hàng #${orderDetails._id}</h2>
            <p>Xin chào <b>${orderDetails.shippingInfo.fullName}</b>,</p>
            <p>Cảm ơn bạn đã đặt hàng. Đơn hàng của bạn đã được xác nhận và đang được xử lý.</p>
            <p><b>Tổng giá trị đơn hàng:</b> ${orderDetails.totalPrice.toLocaleString('vi-VN')} VND</p>
            <p>Cảm ơn bạn đã mua sắm cùng chúng tôi!</p>
          </div>
        `
      };
      
      const backupResult = await backupTransporter.sendMail(simpleMail);
      console.log('Email đơn giản đã được gửi:', backupResult.response);
      return true;
    } catch (backupError) {
      console.error('Cả hai phương pháp gửi email đều thất bại:', backupError);
      return false;
    }
  }
}; 
const Comment = require('../models/Comment');
const Product = require('../models/Product');

exports.getProductComments = async (req, res) => {
    try {
        const { productId } = req.params;
        
        const comments = await Comment.find({ product: productId })
            .populate('user', 'name avatar')
            .sort({ createdAt: -1 });
            
        return res.status(200).json({
            success: true,
            comments
        });
    } catch (error) {
        console.error('Lỗi khi lấy bình luận:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi lấy bình luận'
        });
    }
};

exports.addComment = async (req, res) => {
    try {
        const { productId } = req.params;
        const { content, rating } = req.body;
        const userId = req.user._id;
        
        console.log('ProductID:', productId);
        console.log('UserID:', userId);
        console.log('Content:', content);
        console.log('Rating:', rating);
        
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }
        
        const newComment = new Comment({
            product: productId,
            user: userId,
            content,
            rating: rating || 5
        });
        
        await newComment.save();
        
        const populatedComment = await Comment.findById(newComment._id)
            .populate('user', 'name avatar');
            
        return res.status(201).json({
            success: true,
            comment: populatedComment,
            message: 'Đã thêm bình luận thành công'
        });
    } catch (error) {
        console.error('Lỗi khi thêm bình luận:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi thêm bình luận'
        });
    }
};

exports.updateComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const { content, rating } = req.body;
        const userId = req.user._id;
        
        let comment = await Comment.findById(commentId);
        
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bình luận'
            });
        }
        
        if (comment.user.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền sửa bình luận này'
            });
        }
        
        if (content) comment.content = content;
        if (rating) comment.rating = rating;
        
        await comment.save();
        
        const updatedComment = await Comment.findById(commentId)
            .populate('user', 'name avatar');
            
        return res.status(200).json({
            success: true,
            comment: updatedComment,
            message: 'Đã cập nhật bình luận thành công'
        });
    } catch (error) {
        console.error('Lỗi khi cập nhật bình luận:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi cập nhật bình luận'
        });
    }
};

exports.deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user._id;
        
        const comment = await Comment.findById(commentId);
        
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bình luận'
            });
        }
        
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ admin mới có quyền xóa bình luận'
            });
        }
        
        await Comment.findByIdAndDelete(commentId);
        
        return res.status(200).json({
            success: true,
            message: 'Đã xóa bình luận thành công'
        });
    } catch (error) {
        console.error('Lỗi khi xóa bình luận:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi xóa bình luận'
        });
    }
}; 